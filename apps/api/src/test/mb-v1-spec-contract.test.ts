import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { BucketMessageService, BucketService, UserService } from '@metaboost/orm';

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

describe('mb-v1 spec contract routes', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let publicBucketShortId: string;
  let privateBucketShortId: string;
  let contractPrivateKeyPem: string;

  const prepareSignedBoostPost = async (
    bucketShortId: string,
    body: Record<string, unknown>
  ): Promise<{ pathname: string; raw: string; token: string }> => {
    const pathname = `${API}/standard/mb-v1/boost/${bucketShortId}`;
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

    publicBucketShortId = publicBucket.shortId;
    privateBucketShortId = privateBucket.shortId;
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    setAppRegistryServiceForTests(undefined);
    await destroyApiTestDataSources();
  });

  it('GET /standard/mb-v1/boost/:bucketShortId returns mb-v1 capability fields', async () => {
    const res = await request(app)
      .get(`${API}/standard/mb-v1/boost/${publicBucketShortId}`)
      .expect(200);
    expect(res.body.schema).toBe('mb-v1');
    expect(typeof res.body.message_char_limit).toBe('number');
    expect(res.body.terms_of_service_url).toBe(config.messagesTermsOfServiceUrl);
    expect(typeof res.body.schema_definition_url).toBe('string');
    expect(res.body.schema_definition_url).toContain('/v1/standard/mb-v1/openapi.json');
    expect(typeof res.body.public_messages_url).toBe('string');
  });

  it('GET /standard/mb-v1/boost/:bucketShortId omits public_messages_url for private bucket', async () => {
    const res = await request(app)
      .get(`${API}/standard/mb-v1/boost/${privateBucketShortId}`)
      .expect(200);
    expect(res.body.schema).toBe('mb-v1');
    expect(res.body.public_messages_url).toBeUndefined();
  });

  it('POST /standard/mb-v1/boost/:bucketShortId returns message_guid for boost', async () => {
    const boost = await prepareSignedBoostPost(publicBucketShortId, {
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

  it('GET /standard/mb-v1/messages/public/:bucketShortId lists boost messages', async () => {
    const list = await request(app)
      .get(`${API}/standard/mb-v1/messages/public/${publicBucketShortId}`)
      .expect(200);
    expect(Array.isArray(list.body.messages)).toBe(true);
  });
});
