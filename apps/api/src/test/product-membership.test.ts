/**
 * Public GET /product/membership — billing read model for anonymous clients.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { restoreDefaultApiTestProcessEnv } from './helpers/apiTestAuthEnv.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

describe('GET /product/membership', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let API: string;

  beforeAll(async () => {
    restoreDefaultApiTestProcessEnv();
    const { config } = await import('../config/index.js');
    API = config.apiVersionPath;
    app = await createApiTestApp();
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
    restoreDefaultApiTestProcessEnv();
  });

  it('returns 200 without authentication with stable contract fields', async () => {
    const res = await request(app).get(`${API}/product/membership`).expect(200);
    expect(res.body.data).toMatchObject({
      listPriceCurrencyCode: 'USD',
      selfServePublicSignupOpen: expect.any(Boolean),
      freeTrialExpirationSeconds: expect.any(Number),
      premiumMembershipCostMonthly: expect.any(Number),
      premiumMembershipCostAnnually: expect.any(Number),
    });
    expect(res.body.data.freeTrialExpirationSeconds).toBeGreaterThan(0);
  });
});
