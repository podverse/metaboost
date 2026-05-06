import type { BillingCadence } from '@metaboost/helpers';
import type { EntityManager } from 'typeorm';

import {
  BILLING_DOMAIN_EVENT_TYPES,
  MembershipTier,
  createStubBillingRenewalProviderAdapter,
  type BillingRenewalProviderAdapter,
} from '@metaboost/helpers';

import { appDataSourceReadWrite } from '../data-source.js';
import { UserTrustSettings } from '../entities/UserTrustSettings.js';
import { BillingDomainEventLogService } from './billingDomainEventLog.js';
import { MembershipPeriodExtensionService } from './membershipPeriodExtension.js';

const RENEWAL_BACKOFF_SECONDS = [3600, 14_400, 43_200, 86_400] as const;

function parseCadence(raw: string | null): BillingCadence | null {
  if (raw === 'monthly' || raw === 'annual') {
    return raw;
  }
  return null;
}

function renewalIdempotencyKey(userId: string, membershipExpiresAt: Date): string {
  return `renewal:${userId}:${membershipExpiresAt.toISOString()}`;
}

export type ProcessDueRenewalsSummary = {
  scanned: number;
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
};

/**
 * Scans premium accounts nearing expiry and attempts renewal via {@link BillingRenewalProviderAdapter}.
 */
export class BillingRenewalOrchestratorService {
  private readonly adapter: BillingRenewalProviderAdapter;

  constructor(adapter?: BillingRenewalProviderAdapter) {
    this.adapter = adapter ?? createStubBillingRenewalProviderAdapter();
  }

  async processDueRenewals(params: {
    now?: Date;
    lookaheadHours?: number;
  }): Promise<ProcessDueRenewalsSummary> {
    const now = params.now ?? new Date();
    const lookaheadHours = params.lookaheadHours ?? 24;
    const lookaheadMs = lookaheadHours * 60 * 60 * 1000;
    const horizon = new Date(now.getTime() + lookaheadMs);

    const rows = (await appDataSourceReadWrite.query(
      `
      SELECT
        user_id AS "userId",
        membership_expires_at AS "membershipExpiresAt",
        billing_cadence AS "billingCadence",
        last_renewal_idempotency_key AS "lastRenewalIdempotencyKey",
        last_renewal_status AS "lastRenewalStatus",
        renewal_retry_count AS "renewalRetryCount"
      FROM user_trust_settings
      WHERE membership_tier = $1
        AND auto_renew_mode = $2
        AND billing_cadence IS NOT NULL
        AND membership_expires_at IS NOT NULL
        AND membership_expires_at > $3
        AND membership_expires_at <= $4
        AND (renewal_retry_backoff_until IS NULL OR renewal_retry_backoff_until <= $3)
        AND (next_renewal_attempt_at IS NULL OR next_renewal_attempt_at <= $3)
      `,
      [MembershipTier.Premium, 'on', now, horizon]
    )) as Array<{
      userId: string;
      membershipExpiresAt: Date;
      billingCadence: string;
      lastRenewalIdempotencyKey: string | null;
      lastRenewalStatus: string;
      renewalRetryCount: number;
    }>;

    const summary: ProcessDueRenewalsSummary = {
      scanned: rows.length,
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
    };

    const eventLog = new BillingDomainEventLogService();

    for (const row of rows) {
      const cadence = parseCadence(row.billingCadence);
      if (cadence === null) {
        summary.skipped += 1;
        continue;
      }

      const key = renewalIdempotencyKey(row.userId, row.membershipExpiresAt);
      if (row.lastRenewalIdempotencyKey === key && row.lastRenewalStatus === 'succeeded') {
        summary.skipped += 1;
        continue;
      }

      summary.attempted += 1;

      let attemptResult;
      try {
        attemptResult = await this.adapter.attemptRenewal({
          userId: row.userId,
          cadence,
          idempotencyKey: key,
        });
      } catch {
        await appDataSourceReadWrite.transaction(async (manager) => {
          await this.applyRenewalFailure({
            manager,
            userId: row.userId,
            now,
            idempotencyKey: key,
            retryCount: row.renewalRetryCount,
            retryAfterSeconds: 3600,
          });
          await eventLog.append({
            eventType: BILLING_DOMAIN_EVENT_TYPES.RENEWAL_FAILED,
            userId: row.userId,
            idempotencyKey: `${key}:adapter_error`,
            payload: { stage: 'adapter_throw' },
            manager,
          });
        });
        summary.failed += 1;
        continue;
      }

      if (attemptResult.status === 'succeeded') {
        await appDataSourceReadWrite.transaction(async (manager) => {
          await MembershipPeriodExtensionService.extendPremiumByCadence({
            userId: row.userId,
            cadence,
            idempotencyKey: key,
            reason: 'renewal_success',
            now,
            manager,
          });
          await manager.getRepository(UserTrustSettings).update(
            { userId: row.userId },
            {
              lastRenewalAttemptAt: now,
              lastRenewalStatus: 'succeeded',
              lastRenewalIdempotencyKey: key,
              renewalRetryCount: 0,
              nextRenewalAttemptAt: null,
              renewalRetryBackoffUntil: null,
            }
          );
        });
        summary.succeeded += 1;
      } else {
        const fallbackBackoff =
          RENEWAL_BACKOFF_SECONDS[
            Math.min(row.renewalRetryCount, RENEWAL_BACKOFF_SECONDS.length - 1)
          ] ?? 3600;
        const retryAfterSeconds = attemptResult.retryAfterSeconds ?? fallbackBackoff;
        await appDataSourceReadWrite.transaction(async (manager) => {
          await this.applyRenewalFailure({
            manager,
            userId: row.userId,
            now,
            idempotencyKey: key,
            retryCount: row.renewalRetryCount,
            retryAfterSeconds,
          });
          await eventLog.append({
            eventType: BILLING_DOMAIN_EVENT_TYPES.RENEWAL_FAILED,
            userId: row.userId,
            idempotencyKey: `${key}:failed`,
            payload: {
              providerAttemptId: attemptResult.providerAttemptId ?? null,
            },
            manager,
          });
        });
        summary.failed += 1;
      }
    }

    return summary;
  }

  private async applyRenewalFailure(params: {
    manager: EntityManager;
    userId: string;
    now: Date;
    idempotencyKey: string;
    retryCount: number;
    retryAfterSeconds: number;
  }): Promise<void> {
    const nextAttempt = new Date(params.now.getTime() + params.retryAfterSeconds * 1000);
    const repo = params.manager.getRepository(UserTrustSettings);
    await repo.update(
      { userId: params.userId },
      {
        lastRenewalAttemptAt: params.now,
        lastRenewalStatus: 'failed',
        lastRenewalIdempotencyKey: params.idempotencyKey,
        renewalRetryCount: params.retryCount + 1,
        nextRenewalAttemptAt: nextAttempt,
        renewalRetryBackoffUntil: nextAttempt,
      }
    );
  }
}
