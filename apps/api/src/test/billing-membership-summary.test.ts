/**
 * Authenticated billing membership read model (GET /auth/billing/membership-summary).
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { MembershipTier } from '@metaboost/helpers';
import { UserService } from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';
import { restoreDefaultApiTestProcessEnv } from './helpers/apiTestAuthEnv.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const FILE_PREFIX = 'billing-summary';

describe('GET /auth/billing/membership-summary', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let API: string;
  const email = `${FILE_PREFIX}-${Date.now()}@example.com`;
  const password = `${FILE_PREFIX}-password-1`;

  beforeAll(async () => {
    restoreDefaultApiTestProcessEnv();
    const { config } = await import('../config/index.js');
    API = config.apiVersionPath;
    app = await createApiTestApp();
    const hashed = await hashPassword(password);
    await UserService.create({
      email,
      password: hashed,
      displayName: 'Billing Summary User',
      membershipTier: MembershipTier.Trial,
    });
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
    restoreDefaultApiTestProcessEnv();
  });

  it('returns 401 without session', async () => {
    const res = await request(app).get(`${API}/auth/billing/membership-summary`).expect(401);
    expect(res.body).toMatchObject({ message: 'Authentication required' });
  });

  it('returns nested membership, renewal, and catalog pricing when authenticated', async () => {
    const agent = await createApiLoginAgent(app, { email, password });
    const res = await agent.get(`${API}/auth/billing/membership-summary`).expect(200);
    expect(res.body.data.listPriceCurrencyCode).toBe('USD');
    expect(res.body.data.membership).toMatchObject({
      tier: 'trial',
      expiresAtIso: expect.any(String),
      premiumBillingCadence: null,
      autoRenewMode: expect.stringMatching(/^(off|on)$/),
    });
    expect(res.body.data.renewal).toMatchObject({
      lastStatus: 'none',
      lastAttemptAtIso: null,
      nextAttemptAtIso: null,
      retryCount: expect.any(Number),
    });
    expect(res.body.data.catalog).toMatchObject({
      freeTrialExpirationSeconds: expect.any(Number),
      premiumMembershipCostMonthly: expect.any(Number),
      premiumMembershipCostAnnually: expect.any(Number),
    });
  });
});
