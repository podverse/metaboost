/**
 * Membership period extension idempotency (catalog billing surface).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { MembershipTier } from '@metaboost/helpers';
import {
  MembershipPeriodExtensionService,
  UserService,
  appDataSourceReadWrite,
} from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';
import { restoreDefaultApiTestProcessEnv } from './helpers/apiTestAuthEnv.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const FILE_PREFIX = 'membership-extension';

describe('MembershipPeriodExtensionService.extendPremiumByCadence', () => {
  beforeAll(async () => {
    restoreDefaultApiTestProcessEnv();
    await createApiTestApp();
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
    restoreDefaultApiTestProcessEnv();
  });

  it('returns applied false when the same idempotency key is reused', async () => {
    const email = `${FILE_PREFIX}-${Date.now()}@example.com`;
    const password = `${FILE_PREFIX}-password-1`;
    const hashed = await hashPassword(password);
    const user = await UserService.create({
      email,
      password: hashed,
      displayName: 'Extension Idempotency User',
      membershipTier: MembershipTier.Premium,
      premiumBillingCadence: 'monthly',
      membershipExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      autoRenew: true,
    });

    const idempotencyKey = `${FILE_PREFIX}-idem-${Date.now()}`;

    const first = await MembershipPeriodExtensionService.extendPremiumByCadence({
      userId: user.id,
      cadence: 'monthly',
      idempotencyKey,
      reason: 'payment_settled',
    });

    expect(first.applied).toBe(true);
    expect(first.membershipExpiresAt).not.toBeNull();

    const second = await MembershipPeriodExtensionService.extendPremiumByCadence({
      userId: user.id,
      cadence: 'monthly',
      idempotencyKey,
      reason: 'payment_settled',
    });

    expect(second.applied).toBe(false);
    expect(second.membershipExpiresAt?.getTime()).toBe(first.membershipExpiresAt?.getTime());

    const rows = (await appDataSourceReadWrite.query(
      `
      SELECT COUNT(*)::int AS c
      FROM billing_domain_event
      WHERE user_id = $1 AND idempotency_key = $2
      `,
      [user.id, idempotencyKey]
    )) as Array<{ c: number }>;
    expect(rows[0]?.c).toBe(1);
  });
});
