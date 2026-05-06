import type { BillingRenewalProviderAdapter } from '@metaboost/helpers';

/**
 * Near-expiry renewal orchestration (stub adapter).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { MembershipTier } from '@metaboost/helpers';
import {
  UserService,
  appDataSourceReadWrite,
  BillingRenewalOrchestratorService,
} from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';
import { restoreDefaultApiTestProcessEnv } from './helpers/apiTestAuthEnv.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const FILE_PREFIX = 'billing-renewal';

describe('BillingRenewalOrchestratorService', () => {
  beforeAll(async () => {
    restoreDefaultApiTestProcessEnv();
    await createApiTestApp();
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
    restoreDefaultApiTestProcessEnv();
  });

  it('extends premium membership when expiry is inside the lookahead window', async () => {
    const email = `${FILE_PREFIX}-${Date.now()}@example.com`;
    const password = `${FILE_PREFIX}-password-1`;
    const hashed = await hashPassword(password);
    const nearExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const user = await UserService.create({
      email,
      password: hashed,
      displayName: 'Renewal User',
      membershipTier: MembershipTier.Premium,
      premiumBillingCadence: 'monthly',
      membershipExpiresAt: nearExpiry,
      autoRenew: true,
    });

    await appDataSourceReadWrite.query(
      `
      UPDATE user_trust_settings
      SET billing_cadence = $1,
          auto_renew_mode = $2,
          membership_expires_at = $3
      WHERE user_id = $4
      `,
      ['monthly', 'on', nearExpiry, user.id]
    );

    const orchestrator = new BillingRenewalOrchestratorService();
    const summary = await orchestrator.processDueRenewals({
      now: new Date(),
      lookaheadHours: 24,
    });

    expect(summary.attempted).toBeGreaterThanOrEqual(1);
    expect(summary.succeeded).toBeGreaterThanOrEqual(1);

    const refreshed = await UserService.findById(user.id);
    expect(refreshed?.trustSettings?.membershipExpiresAt).not.toBeNull();
    expect(refreshed?.trustSettings?.membershipExpiresAt?.getTime() ?? 0).toBeGreaterThan(
      nearExpiry.getTime()
    );

    const events = (await appDataSourceReadWrite.query(
      `
      SELECT event_type
      FROM billing_domain_event
      WHERE user_id = $1
      ORDER BY id DESC
      LIMIT 5
      `,
      [user.id]
    )) as Array<{ event_type: string }>;
    const types = events.map((row) => row.event_type);
    expect(types).toContain('renewal_succeeded');
  });

  it('does not select premium users whose expiry is beyond the lookahead horizon', async () => {
    const email = `${FILE_PREFIX}-far-${Date.now()}@example.com`;
    const password = `${FILE_PREFIX}-password-1`;
    const hashed = await hashPassword(password);
    const farExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const user = await UserService.create({
      email,
      password: hashed,
      displayName: 'Far Expiry User',
      membershipTier: MembershipTier.Premium,
      premiumBillingCadence: 'monthly',
      membershipExpiresAt: farExpiry,
      autoRenew: true,
    });

    await appDataSourceReadWrite.query(
      `
      UPDATE user_trust_settings
      SET billing_cadence = $1,
          auto_renew_mode = $2,
          membership_expires_at = $3
      WHERE user_id = $4
      `,
      ['monthly', 'on', farExpiry, user.id]
    );

    const now = new Date();
    const lookaheadHours = 24;
    const horizon = new Date(now.getTime() + lookaheadHours * 60 * 60 * 1000);

    const eligible = (await appDataSourceReadWrite.query(
      `
      SELECT user_id
      FROM user_trust_settings
      WHERE user_id = $1
        AND membership_tier = $2
        AND auto_renew_mode = $3
        AND billing_cadence IS NOT NULL
        AND membership_expires_at IS NOT NULL
        AND membership_expires_at > $4
        AND membership_expires_at <= $5
      `,
      [user.id, MembershipTier.Premium, 'on', now, horizon]
    )) as Array<{ user_id: string }>;

    expect(eligible.length).toBe(0);
  });

  it('records renewal_failed and schedules retry when the adapter returns failed', async () => {
    const email = `${FILE_PREFIX}-fail-${Date.now()}@example.com`;
    const password = `${FILE_PREFIX}-password-1`;
    const hashed = await hashPassword(password);
    const nearExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const user = await UserService.create({
      email,
      password: hashed,
      displayName: 'Renewal Fail User',
      membershipTier: MembershipTier.Premium,
      premiumBillingCadence: 'monthly',
      membershipExpiresAt: nearExpiry,
      autoRenew: true,
    });

    await appDataSourceReadWrite.query(
      `
      UPDATE user_trust_settings
      SET billing_cadence = $1,
          auto_renew_mode = $2,
          membership_expires_at = $3,
          renewal_retry_count = 0,
          next_renewal_attempt_at = NULL,
          renewal_retry_backoff_until = NULL
      WHERE user_id = $4
      `,
      ['monthly', 'on', nearExpiry, user.id]
    );

    const failingAdapter: BillingRenewalProviderAdapter = {
      async attemptRenewal() {
        return { status: 'failed', retryAfterSeconds: 120 };
      },
    };

    const orchestrator = new BillingRenewalOrchestratorService(failingAdapter);
    const summary = await orchestrator.processDueRenewals({
      now: new Date(),
      lookaheadHours: 24,
    });

    expect(summary.failed).toBeGreaterThanOrEqual(1);

    const trustRows = (await appDataSourceReadWrite.query(
      `
      SELECT renewal_retry_count, next_renewal_attempt_at, last_renewal_status
      FROM user_trust_settings
      WHERE user_id = $1
      `,
      [user.id]
    )) as Array<{
      renewal_retry_count: number;
      next_renewal_attempt_at: Date | null;
      last_renewal_status: string;
    }>;

    expect(trustRows[0]?.renewal_retry_count).toBeGreaterThanOrEqual(1);
    expect(trustRows[0]?.next_renewal_attempt_at).not.toBeNull();
    expect(trustRows[0]?.last_renewal_status).toBe('failed');

    const failEvents = (await appDataSourceReadWrite.query(
      `
      SELECT event_type
      FROM billing_domain_event
      WHERE user_id = $1
      ORDER BY id DESC
      LIMIT 5
      `,
      [user.id]
    )) as Array<{ event_type: string }>;
    expect(failEvents.map((row) => row.event_type)).toContain('renewal_failed');
  });
});
