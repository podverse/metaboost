/**
 * API integration tests: public bucket endpoint and exchange rates route.
 * Covers GET /buckets/public/:id (no auth) and GET /exchange-rates (public).
 */
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { BucketService, UserService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'pub-bucket';

function mockExchangeFetch(): void {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('frankfurter.app')) {
      return new Response(JSON.stringify({ rates: { EUR: 0.9, USD: 1 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('coingecko.com')) {
      return new Response(JSON.stringify({ bitcoin: { usd: 100_000 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('Not Found', { status: 404 });
  });
}

describe('public bucket and exchange rates', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password-1`;
  let publicBucketIdText: string;
  let privateBucketIdText: string;

  beforeAll(async () => {
    app = await createApiTestApp();
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'Public Bucket Owner',
    });
    const publicBucket = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: `${FILE_PREFIX}-public`,
      isPublic: true,
    });
    publicBucketIdText = publicBucket.idText;
    const privateBucket = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: `${FILE_PREFIX}-private`,
      isPublic: false,
    });
    privateBucketIdText = privateBucket.idText;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await destroyApiTestDataSources();
  });

  describe('GET /buckets/public/:id', () => {
    it('returns 200 with public bucket details without auth', async () => {
      const res = await request(app).get(`${API}/buckets/public/${publicBucketIdText}`).expect(200);
      expect(res.body.bucket).toBeDefined();
      expect(res.body.bucket.idText).toBe(publicBucketIdText);
      expect(res.body.bucket.name).toBe(`${FILE_PREFIX}-public`);
      expect(res.body.bucket.isPublic).toBe(true);
      expect(res.body.bucket).toHaveProperty('id');
      expect(res.body.bucket).toHaveProperty('type');
      expect(res.body.bucket).toHaveProperty('messageBodyMaxLength');
      expect(res.body.bucket).toHaveProperty('preferredCurrency');
      expect(res.body.bucket).toHaveProperty('minimumMessageAmountMinor');
      expect(res.body.bucket).toHaveProperty('conversionEndpointUrl');
      // Public response should not expose ownerId
      expect(res.body.bucket).not.toHaveProperty('ownerId');
      expect(Array.isArray(res.body.bucket.ancestors)).toBe(true);
    });

    it('returns 404 for nonexistent bucket', async () => {
      await request(app)
        .get(`${API}/buckets/public/nonexistent-short-id`)
        .expect(404, { message: 'Bucket not found' });
    });

    it('returns 404 for private bucket', async () => {
      await request(app)
        .get(`${API}/buckets/public/${privateBucketIdText}`)
        .expect(404, { message: 'Bucket not found' });
    });

    it('includes ancestors for child bucket', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const childRes = await agent
        .post(`${API}/buckets/${publicBucketIdText}/buckets`)
        .send({ type: 'mb-mid', name: `${FILE_PREFIX}-child-mid-${Date.now()}` })
        .expect(201);
      const childShortId = childRes.body.bucket.idText;
      const res = await request(app).get(`${API}/buckets/public/${childShortId}`).expect(200);
      expect(res.body.bucket.ancestors).toHaveLength(1);
      expect(res.body.bucket.ancestors[0].idText).toBe(publicBucketIdText);
    });
  });

  describe('GET /exchange-rates', () => {
    beforeEach(() => {
      mockExchangeFetch();
    });

    it('returns 200 with exchange rate conversions', async () => {
      const res = await request(app)
        .get(`${API}/exchange-rates?source_currency=USD&source_amount=100&amount_unit=cents`)
        .expect(200);
      expect(res.body.source).toBeDefined();
      expect(res.body.source.currency).toBe('USD');
      expect(res.body.source.amountMinor).toBe(100);
      expect(res.body.source.amountUnit).toBe('cents');
      expect(Array.isArray(res.body.conversions)).toBe(true);
      expect(res.body.conversions.length).toBeGreaterThanOrEqual(1);
      expect(res.body.metadata).toBeDefined();
      expect(res.body.metadata).toHaveProperty('exchangeRatesFetchedAt');
      expect(res.body.metadata).toHaveProperty('fiatBaseCurrency');
      expect(res.body.metadata).toHaveProperty('supportedCurrencies');
      expect(res.body.metadata).toHaveProperty('currencyUnits');
    });

    it('returns 400 when source_currency is missing', async () => {
      await request(app)
        .get(`${API}/exchange-rates?source_amount=100&amount_unit=cents`)
        .expect(400);
    });

    it('returns 400 when source_amount is missing', async () => {
      await request(app)
        .get(`${API}/exchange-rates?source_currency=USD&amount_unit=cents`)
        .expect(400);
    });

    it('returns 400 when amount_unit is missing', async () => {
      await request(app)
        .get(`${API}/exchange-rates?source_currency=USD&source_amount=100`)
        .expect(400);
    });

    it('returns 400 when source_currency is unsupported', async () => {
      await request(app)
        .get(`${API}/exchange-rates?source_currency=DOGE&source_amount=100&amount_unit=cents`)
        .expect(400);
    });
  });
});
