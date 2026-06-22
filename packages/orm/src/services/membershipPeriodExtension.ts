import type { EntityManager } from 'typeorm';

import {
  BILLING_DOMAIN_EVENT_TYPES,
  MembershipTier,
  extendMembershipPeriodByCadence,
  type BillingCadence,
  type MembershipPeriodExtensionReason,
} from '@metaboost/helpers';

import { appDataSourceReadWrite } from '../data-source.js';
import { UserTrustSettings } from '../entities/UserTrustSettings.js';
import { BillingDomainEventLogService } from './billingDomainEventLog.js';

function eventTypeForExtensionReason(
  reason: MembershipPeriodExtensionReason
): (typeof BILLING_DOMAIN_EVENT_TYPES)[keyof typeof BILLING_DOMAIN_EVENT_TYPES] | null {
  if (reason === 'renewal_success') {
    return BILLING_DOMAIN_EVENT_TYPES.RENEWAL_SUCCEEDED;
  }
  if (reason === 'payment_settled' || reason === 'pay_on_demand_extension') {
    return BILLING_DOMAIN_EVENT_TYPES.PAYMENT_SETTLED;
  }
  return null;
}

export class MembershipPeriodExtensionService {
  /**
   * Extends premium membership expiry using {@link extendMembershipPeriodByCadence} and records
   * idempotency on trust settings. Delegates all calendar math to helpers.
   */
  static async extendPremiumByCadence(params: {
    userId: string;
    cadence: BillingCadence;
    idempotencyKey: string;
    reason: MembershipPeriodExtensionReason;
    now?: Date;
    manager?: EntityManager;
  }): Promise<{ applied: boolean; membershipExpiresAt: Date | null }> {
    const now = params.now ?? new Date();
    const run = async (
      manager: EntityManager
    ): Promise<{
      applied: boolean;
      membershipExpiresAt: Date | null;
    }> => {
      const repo = manager.getRepository(UserTrustSettings);
      const trust = await repo.findOne({ where: { userId: params.userId } });
      if (trust === null) {
        throw new Error(
          'MembershipPeriodExtensionService.extendPremiumByCadence: trust settings missing'
        );
      }
      if (trust.membershipTier !== MembershipTier.Premium) {
        throw new Error(
          'MembershipPeriodExtensionService.extendPremiumByCadence: user is not premium'
        );
      }
      if (trust.lastExtensionIdempotencyKey === params.idempotencyKey) {
        return { applied: false, membershipExpiresAt: trust.membershipExpiresAt };
      }
      const newExpiry = extendMembershipPeriodByCadence({
        membershipExpiresAt: trust.membershipExpiresAt,
        cadence: params.cadence,
        now,
      });
      trust.membershipExpiresAt = newExpiry;
      trust.billingCadence = params.cadence;
      trust.lastExtensionIdempotencyKey = params.idempotencyKey;
      await repo.save(trust);

      const eventType = eventTypeForExtensionReason(params.reason);
      if (eventType !== null) {
        const log = new BillingDomainEventLogService();
        await log.append({
          eventType,
          userId: params.userId,
          idempotencyKey: params.idempotencyKey,
          payload: { reason: params.reason },
          manager,
        });
      }

      return { applied: true, membershipExpiresAt: newExpiry };
    };

    if (params.manager !== undefined) {
      return run(params.manager);
    }
    return appDataSourceReadWrite.transaction(run);
  }

  static async logPayOnDemandExtensionRequested(params: {
    userId: string;
    idempotencyKey: string;
    manager?: EntityManager;
  }): Promise<void> {
    const log = new BillingDomainEventLogService();
    await log.append({
      eventType: BILLING_DOMAIN_EVENT_TYPES.PAY_ON_DEMAND_EXTENSION_REQUESTED,
      userId: params.userId,
      idempotencyKey: params.idempotencyKey,
      payload: {},
      manager: params.manager,
    });
  }
}
