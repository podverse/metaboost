import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BucketMessageService,
  BucketMessageValue,
  BucketService,
  UserTermsAcceptanceService,
  UserService,
  appDataSourceReadWrite,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { AppRegistryService } from '../lib/appRegistry/AppRegistryService.js';
import { setAppRegistryServiceForTests } from '../lib/appRegistry/singleton.js';
import { hashPassword } from '../lib/auth/hash.js';
import { signAppAssertionForTests } from './helpers/appAssertionSign.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'mb-v1-contract';
const CONTRACT_SENDER_GUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CONTRACT_APP_ID = 'contractmbrss';

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

describe('mb-v1 spec contract routes', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let publicBucketIdText: string;
  let privateBucketIdText: string;
  let contractPrivateKeyPem: string;

  const prepareSignedBoostPost = async (
    bucketIdText: string,
    body: Record<string, unknown>
  ): Promise<{ pathname: string; raw: string; token: string }> => {
    const pathname = `${API}/standard/mb-v1/boost/${bucketIdText}`;
    const raw = JSON.stringify(body);
    const token = await signAppAssertionForTests({
      privateKeyPem: contractPrivateKeyPem,
      appId: CONTRACT_APP_ID,
      pathname,
      rawBodyUtf8: raw,
    });
    return { pathname, raw, token };
  };

  beforeAll(async () => {
    const pair = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
    contractPrivateKeyPem = Buffer.from(await exportPKCS8(pair.privateKey)).toString('utf8');
    const pubJwk = await exportJWK(pair.publicKey);
    if (typeof pubJwk.x !== 'string') {
      throw new Error('Expected Ed25519 public JWK x');
    }
    const registryJson = {
      app_id: CONTRACT_APP_ID,
      display_name: 'Contract Test',
      owner: { name: 'T', email: 't@example.com' },
      status: 'active',
      signing_keys: [
        {
          kty: 'OKP',
          crv: 'Ed25519',
          alg: 'EdDSA',
          x: pubJwk.x,
          status: 'active',
        },
      ],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const registryBase = 'https://registry.test/apps';
    const mockFetch: typeof fetch = async (input) => {
      const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (u.endsWith(`/${CONTRACT_APP_ID}.app.json`)) {
        return new Response(JSON.stringify(registryJson), {
          status: 200,
          headers: { etag: '"c1"' },
        });
      }
      return new Response('Not Found', { status: 404 });
    };

    setAppRegistryServiceForTests(
      new AppRegistryService({
        registryBaseUrl: registryBase,
        pollIntervalMs: 300_000,
        fetchTimeoutMs: 10_000,
        fetchFn: mockFetch,
      })
    );

    app = await createApiTestApp();
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-owner-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'Mb Contract Owner',
    });
    await UserTermsAcceptanceService.recordAcceptanceForCurrentVersion(owner.id);
    const publicBucket = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: 'Mb Public Root',
      isPublic: true,
    });
    const privateBucket = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: 'Mb Private Root',
      isPublic: false,
    });

    publicBucketIdText = publicBucket.idText;
    privateBucketIdText = privateBucket.idText;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    mockExchangeFetch();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    setAppRegistryServiceForTests(undefined);
    await destroyApiTestDataSources();
  });

  it('GET /standard/mb-v1/boost/:bucketIdText returns mb-v1 capability fields', async () => {
    const res = await request(app)
      .get(`${API}/standard/mb-v1/boost/${publicBucketIdText}`)
      .expect(200);
    expect(res.body.schema).toBe('mb-v1');
    expect(typeof res.body.message_char_limit).toBe('number');
    expect(res.body.terms_of_service_url).toBe(config.messagesTermsOfServiceUrl);
    expect(typeof res.body.schema_definition_url).toBe('string');
    expect(res.body.schema_definition_url).toContain(`${API}/standard/mb-v1/openapi.json`);
    expect(typeof res.body.public_messages_url).toBe('string');
    expect(res.body.preferred_currency).toBe('USD');
    expect(res.body.minimum_message_amount_minor).toBeUndefined();
    expect(typeof res.body.conversion_endpoint_url).toBe('string');
    expect(res.body.conversion_endpoint_url).toContain(
      `${API}/buckets/public/${publicBucketIdText}/conversion`
    );
  });

  it('GET /standard/mb-v1/boost/:bucketIdText omits public_messages_url for private bucket', async () => {
    const res = await request(app)
      .get(`${API}/standard/mb-v1/boost/${privateBucketIdText}`)
      .expect(200);
    expect(res.body.schema).toBe('mb-v1');
    expect(res.body.public_messages_url).toBeUndefined();
    expect(res.body.conversion_endpoint_url).toBeUndefined();
  });

  it('POST /standard/mb-v1/boost/:bucketIdText rejects missing amount_unit', async () => {
    const boost = await prepareSignedBoostPost(publicBucketIdText, {
      currency: 'BTC',
      amount: 1000,
      action: 'boost',
      app_name: 'Test App',
      sender_name: 'Missing Unit',
      sender_guid: CONTRACT_SENDER_GUID,
      message: 'missing amount unit',
    });
    const res = await request(app)
      .post(boost.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${boost.token}`)
      .send(boost.raw)
      .expect(400);
    expect(res.body.message).toContain('Validation failed');
  });

  it('POST /standard/mb-v1/boost/:bucketIdText rejects invalid amount_unit for currency', async () => {
    const boost = await prepareSignedBoostPost(publicBucketIdText, {
      currency: 'USD',
      amount: 1000,
      amount_unit: 'satoshis',
      action: 'boost',
      app_name: 'Test App',
      sender_name: 'Invalid Unit',
      sender_guid: CONTRACT_SENDER_GUID,
      message: 'invalid amount unit',
    });
    const res = await request(app)
      .post(boost.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${boost.token}`)
      .send(boost.raw)
      .expect(400);
    expect(res.body.message).toContain('Validation failed');
  });

  it('POST /standard/mb-v1/boost/:bucketIdText persists boosts regardless of publicBoostDisplayMinimumMinor', async () => {
    const bucket = await BucketService.findByIdText(publicBucketIdText);
    expect(bucket).not.toBeNull();
    if (bucket === null) {
      throw new Error('Expected public bucket');
    }
    await BucketService.update(bucket.id, { publicBoostDisplayMinimumMinor: 200 });
    try {
      const lowBoost = await prepareSignedBoostPost(publicBucketIdText, {
        currency: 'USD',
        amount: 150,
        amount_unit: 'cents',
        action: 'boost',
        app_name: 'Display Floor App',
        sender_name: 'Low Sender',
        sender_guid: CONTRACT_SENDER_GUID,
        message: 'below display floor but ingested',
      });
      const lowRes = await request(app)
        .post(lowBoost.pathname)
        .set('Content-Type', 'application/json')
        .set('Authorization', `AppAssertion ${lowBoost.token}`)
        .send(lowBoost.raw)
        .expect(201);
      expect(typeof lowRes.body.message_guid).toBe('string');
    } finally {
      await BucketService.update(bucket.id, { publicBoostDisplayMinimumMinor: 0 });
    }
  });

  it('POST /standard/mb-v1/boost/:bucketIdText rejects messages when owner has not accepted latest terms', async () => {
    const bucket = await BucketService.findByIdText(publicBucketIdText);
    expect(bucket).not.toBeNull();
    if (bucket === null) {
      throw new Error('Expected public bucket');
    }

    await appDataSourceReadWrite.query(`DELETE FROM user_terms_acceptance WHERE user_id = $1`, [
      bucket.ownerId,
    ]);
    await UserTermsAcceptanceService.upsertAcceptance(
      bucket.ownerId,
      new Date('2000-01-01T00:00:00.000Z')
    );
    try {
      const boost = await prepareSignedBoostPost(publicBucketIdText, {
        currency: 'USD',
        amount: 1050,
        amount_unit: 'cents',
        action: 'boost',
        app_name: 'Terms Blocked App',
        sender_name: 'Terms Blocked Sender',
        sender_guid: CONTRACT_SENDER_GUID,
        message: 'owner terms not accepted',
      });
      const res = await request(app)
        .post(boost.pathname)
        .set('Content-Type', 'application/json')
        .set('Authorization', `AppAssertion ${boost.token}`)
        .send(boost.raw)
        .expect(403);
      expect(res.body.code).toBe('owner_terms_not_accepted_current');
    } finally {
      await UserTermsAcceptanceService.recordAcceptanceForCurrentVersion(bucket.ownerId);
    }
  });

  it('GET /standard/mb-v1/boost/:bucketIdText returns terms-blocked error when owner must accept current terms', async () => {
    const bucket = await BucketService.findByIdText(publicBucketIdText);
    expect(bucket).not.toBeNull();
    if (bucket === null) {
      throw new Error('Expected public bucket');
    }

    await appDataSourceReadWrite.query(`DELETE FROM user_terms_acceptance WHERE user_id = $1`, [
      bucket.ownerId,
    ]);
    await UserTermsAcceptanceService.upsertAcceptance(
      bucket.ownerId,
      new Date('2000-01-01T00:00:00.000Z')
    );
    try {
      const res = await request(app)
        .get(`${API}/standard/mb-v1/boost/${publicBucketIdText}`)
        .expect(403);
      expect(res.body.code).toBe('owner_terms_not_accepted_current');
    } finally {
      await UserTermsAcceptanceService.recordAcceptanceForCurrentVersion(bucket.ownerId);
    }
  });

  it('POST /standard/mb-v1/boost/:bucketIdText returns message_guid for boost', async () => {
    const boost = await prepareSignedBoostPost(publicBucketIdText, {
      currency: 'BTC',
      amount: 1000,
      amount_unit: 'satoshis',
      action: 'boost',
      app_name: 'Test App',
      sender_name: 'Bob',
      sender_guid: CONTRACT_SENDER_GUID,
      message: 'mb-v1 hello',
    });
    const created = await request(app)
      .post(boost.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${boost.token}`)
      .send(boost.raw)
      .expect(201);

    expect(typeof created.body.message_guid).toBe('string');
    const msg = await BucketMessageService.findById(created.body.message_guid);
    expect(msg).not.toBeNull();
  });

  it('POST /standard/mb-v1/boost/:bucketIdText persists threshold snapshots in root preferred currency', async () => {
    const usdBoost = await prepareSignedBoostPost(publicBucketIdText, {
      currency: 'USD',
      amount: 123,
      amount_unit: 'cents',
      action: 'boost',
      app_name: 'Contract USD Snapshot',
      sender_name: 'USD Sender',
      sender_guid: CONTRACT_SENDER_GUID,
      message: 'mb-v1 usd snapshot',
    });
    const usdCreated = await request(app)
      .post(usdBoost.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${usdBoost.token}`)
      .send(usdBoost.raw)
      .expect(201);
    const usdValue = await appDataSourceReadWrite.getRepository(BucketMessageValue).findOne({
      where: { bucketMessageId: usdCreated.body.message_guid as string },
    });
    expect(usdValue).not.toBeNull();
    expect(usdValue?.thresholdCurrencyAtCreate).toBe('USD');
    expect(usdValue?.thresholdAmountMinorAtCreate).toBe(123);

    const btcBoost = await prepareSignedBoostPost(publicBucketIdText, {
      currency: 'BTC',
      amount: 10_000,
      amount_unit: 'satoshis',
      action: 'boost',
      app_name: 'Contract BTC Snapshot',
      sender_name: 'BTC Sender',
      sender_guid: CONTRACT_SENDER_GUID,
      message: 'mb-v1 btc snapshot',
    });
    const btcCreated = await request(app)
      .post(btcBoost.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${btcBoost.token}`)
      .send(btcBoost.raw)
      .expect(201);
    const btcValue = await appDataSourceReadWrite.getRepository(BucketMessageValue).findOne({
      where: { bucketMessageId: btcCreated.body.message_guid as string },
    });
    expect(btcValue).not.toBeNull();
    if (btcValue === null) {
      throw new Error('Expected BTC message value row to exist');
    }
    expect(btcValue.thresholdCurrencyAtCreate).toBe('USD');
    expect(
      btcValue.thresholdAmountMinorAtCreate === null || btcValue.thresholdAmountMinorAtCreate > 0
    ).toBe(true);
  });

  it('GET /standard/mb-v1/messages/public/:bucketIdText lists boost messages', async () => {
    const list = await request(app)
      .get(`${API}/standard/mb-v1/messages/public/${publicBucketIdText}`)
      .expect(200);
    expect(Array.isArray(list.body.messages)).toBe(true);
    const first = (list.body.messages as Array<Record<string, unknown>>)[0];
    if (first !== undefined) {
      expect(first.senderGuid).toBeUndefined();
      expect(first.breadcrumbContext ?? null).toBeNull();
    }
  });

  it('GET /standard/mb-v1/messages/public/:bucketIdText applies root display floor and query minimum max behavior', async () => {
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-threshold-owner-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'Mb Threshold Owner',
    });
    const thresholdBucket = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: `Mb Threshold Root ${Date.now()}`,
      isPublic: true,
    });
    await BucketService.update(thresholdBucket.id, { publicBoostDisplayMinimumMinor: 200 });

    const lowBody = `mb-v1-threshold-low-${Date.now()}`;
    const highBody = `mb-v1-threshold-high-${Date.now()}`;
    const nullBody = `mb-v1-threshold-null-${Date.now()}`;
    await BucketMessageService.create({
      bucketId: thresholdBucket.id,
      senderName: 'Threshold Low Sender',
      body: lowBody,
      currency: 'USD',
      amount: 150,
      amountUnit: 'cents',
      action: 'boost',
      appName: 'threshold-test',
      thresholdCurrencyAtCreate: 'USD',
      thresholdAmountMinorAtCreate: 150,
    });
    await BucketMessageService.create({
      bucketId: thresholdBucket.id,
      senderName: 'Threshold High Sender',
      body: highBody,
      currency: 'USD',
      amount: 300,
      amountUnit: 'cents',
      action: 'boost',
      appName: 'threshold-test',
      thresholdCurrencyAtCreate: 'USD',
      thresholdAmountMinorAtCreate: 300,
    });
    await BucketMessageService.create({
      bucketId: thresholdBucket.id,
      senderName: 'Threshold Null Sender',
      body: nullBody,
      currency: 'USD',
      amount: 1,
      action: 'boost',
      appName: 'threshold-test',
      thresholdCurrencyAtCreate: null,
      thresholdAmountMinorAtCreate: null,
    });

    const baseline = await request(app)
      .get(`${API}/standard/mb-v1/messages/public/${thresholdBucket.idText}`)
      .expect(200);
    const baselineBodies = (baseline.body.messages as Array<{ body: string | null }>).map(
      (message) => message.body
    );
    expect(baselineBodies).toContain(highBody);
    expect(baselineBodies).not.toContain(lowBody);
    expect(baselineBodies).not.toContain(nullBody);

    const tightened = await request(app)
      .get(`${API}/standard/mb-v1/messages/public/${thresholdBucket.idText}?minimumAmountMinor=350`)
      .expect(200);
    expect(tightened.body.messages).toHaveLength(0);
  });
});
