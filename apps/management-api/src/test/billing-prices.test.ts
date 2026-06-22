/**
 * Management API: billing price governance (read + schedule + deprecate).
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { CRUD_BITS } from '@metaboost/helpers';
import { appDataSourceRead } from '@metaboost/orm';

import { config } from '../config/index.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'billing-prices';
const superAdminUsername = `${FILE_PREFIX}-super-admin`;
const superAdminPassword = `${FILE_PREFIX}-super-admin-password-1`;
const billingReaderUsername = `${FILE_PREFIX}-billing-read`;
const billingReaderPassword = `${FILE_PREFIX}-billing-read-password-1`;
const noBillingUsername = `${FILE_PREFIX}-no-billing`;
const noBillingPassword = `${FILE_PREFIX}-no-billing-password-1`;

describe('management-api billing-prices', () => {
  let app: Awaited<ReturnType<typeof createManagementApiTestAppWithSuperAdmin>>;
  let superAdminAgent: ReturnType<typeof request.agent>;
  let billingReaderAgent: ReturnType<typeof request.agent>;
  let noBillingAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await createManagementApiTestAppWithSuperAdmin(superAdminUsername, superAdminPassword);
    superAdminAgent = await createManagementLoginAgent(app, {
      username: superAdminUsername,
      password: superAdminPassword,
    });
    await superAdminAgent
      .post(`${API}/admins`)
      .send({
        username: billingReaderUsername,
        password: billingReaderPassword,
        displayName: 'Billing Reader',
        adminsCrud: 0,
        usersCrud: 0,
        bucketsCrud: 0,
        bucketMessagesCrud: 0,
        bucketAdminsCrud: 0,
        billingPricesCrud: CRUD_BITS.read,
        eventVisibility: 'own',
      })
      .expect(201);
    billingReaderAgent = await createManagementLoginAgent(app, {
      username: billingReaderUsername,
      password: billingReaderPassword,
    });
    await superAdminAgent
      .post(`${API}/admins`)
      .send({
        username: noBillingUsername,
        password: noBillingPassword,
        displayName: 'No Billing',
        adminsCrud: 0,
        usersCrud: CRUD_BITS.read,
        bucketsCrud: 0,
        bucketMessagesCrud: 0,
        bucketAdminsCrud: 0,
        billingPricesCrud: 0,
        eventVisibility: 'own',
      })
      .expect(201);
    noBillingAgent = await createManagementLoginAgent(app, {
      username: noBillingUsername,
      password: noBillingPassword,
    });
  });

  afterAll(async () => {
    await destroyManagementApiTestDataSources();
  });

  describe('GET /product/membership', () => {
    it('returns 200 for admin with billingPrices read', async () => {
      const res = await billingReaderAgent.get(`${API}/product/membership`).expect(200);
      expect(res.body.data).toMatchObject({
        freeTrialExpirationSeconds: expect.any(Number),
        premiumMembershipCostMonthly: expect.any(Number),
        premiumMembershipCostAnnually: expect.any(Number),
      });
    });
  });

  describe('GET /billing-prices/windows', () => {
    it('returns 401 without authentication', async () => {
      await request(app).get(`${API}/billing-prices/windows`).expect(401);
    });

    it('returns windows with status for billing reader', async () => {
      const res = await billingReaderAgent.get(`${API}/billing-prices/windows`).expect(200);
      expect(res.body.data.defaultCurrency).toBe('USD');
      expect(Array.isArray(res.body.data.windows)).toBe(true);
      expect(res.body.data.windows.length).toBeGreaterThanOrEqual(2);
      const first = res.body.data.windows[0] as { status?: string };
      expect(['active', 'scheduled', 'historical']).toContain(first?.status);
    });
  });

  describe('GET /billing-prices/audit', () => {
    it('returns audit entries for billing reader', async () => {
      const res = await billingReaderAgent.get(`${API}/billing-prices/audit?limit=5`).expect(200);
      expect(Array.isArray(res.body.data.entries)).toBe(true);
    });
  });

  describe('Authorization boundaries', () => {
    it('returns 403 when authed admin lacks billingPrices read', async () => {
      await noBillingAgent.get(`${API}/billing-prices`).expect(403);
      await noBillingAgent.get(`${API}/billing-prices/windows`).expect(403);
      await noBillingAgent.get(`${API}/product/membership`).expect(403);
    });

    it('returns 403 when billing reader attempts schedule or deprecate', async () => {
      const effectiveFrom = new Date();
      await billingReaderAgent
        .post(`${API}/billing-prices`)
        .send({
          currencyCode: 'USD',
          billingCadence: 'monthly',
          amountCents: 30200,
          effectiveFrom: effectiveFrom.toISOString(),
          changeReason: 'should be forbidden',
        })
        .expect(403);
      await billingReaderAgent.post(`${API}/billing-prices/1/deprecate`).send({}).expect(403);
    });
  });

  describe('GET /billing-prices', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).get(`${API}/billing-prices`).expect(401);
      expect(res.body).toMatchObject({ message: 'Authentication required' });
    });

    it('returns active premium prices when authenticated', async () => {
      const res = await superAdminAgent.get(`${API}/billing-prices`).expect(200);
      expect(res.body.data.defaultCurrency).toBe('USD');
      expect(Array.isArray(res.body.data.prices)).toBe(true);
      expect(res.body.data.prices.length).toBeGreaterThanOrEqual(2);
      const cadences = res.body.data.prices.map(
        (row: { billingCadence: string }) => row.billingCadence
      );
      expect(cadences).toContain('monthly');
      expect(cadences).toContain('annual');
    });
  });

  describe('POST /billing-prices (schedule)', () => {
    it('creates a new price row and audit trail', async () => {
      const effectiveFrom = new Date();
      const res = await superAdminAgent
        .post(`${API}/billing-prices`)
        .send({
          currencyCode: 'USD',
          billingCadence: 'monthly',
          amountCents: 30100,
          effectiveFrom: effectiveFrom.toISOString(),
          changeReason: 'billing-prices integration test',
        })
        .expect(201);
      expect(res.body.data.newPriceId).toEqual(expect.any(Number));

      const auditRows = (await appDataSourceRead.query(
        `SELECT COUNT(*)::int AS c FROM billing_price_change_audit WHERE billing_price_id = $1`,
        [res.body.data.newPriceId]
      )) as Array<{ c: number }>;
      expect(auditRows[0]?.c).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /billing-prices/:id/deprecate', () => {
    it('returns 400 for invalid id', async () => {
      await superAdminAgent.post(`${API}/billing-prices/not-an-int/deprecate`).send({}).expect(400);
    });

    it('returns 404 for unknown price id', async () => {
      await superAdminAgent.post(`${API}/billing-prices/999999999/deprecate`).send({}).expect(404);
    });
  });
});
