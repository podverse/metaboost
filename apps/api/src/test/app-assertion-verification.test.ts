import { randomUUID } from 'crypto';
import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../config/index.js';
import { AppRegistryService } from '../lib/appRegistry/AppRegistryService.js';
import { setAppRegistryServiceForTests } from '../lib/appRegistry/singleton.js';
import { disconnectReplayStoreForTests } from '../lib/valkey/replayStore.js';
import { signAppAssertionForTests } from './helpers/appAssertionSign.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const APP_ID = 'asserttest01';
const STANDARD_MBRSS_OPENAPI_PATH = `${API}/standard/mbrss-v1/openapi.json`;
const STANDARD_MB_V1_OPENAPI_PATH = `${API}/standard/mb-v1/openapi.json`;

describe('Standard Endpoint AppAssertion verification', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let privateKeyPem: string;
  let registryJson: Record<string, unknown>;

  beforeAll(async () => {
    const pair = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
    privateKeyPem = Buffer.from(await exportPKCS8(pair.privateKey)).toString('utf8');
    const pubJwk = await exportJWK(pair.publicKey);
    if (typeof pubJwk.x !== 'string') {
      throw new Error('Expected Ed25519 x');
    }
    registryJson = {
      app_id: APP_ID,
      display_name: 'Assert Test',
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

    const registryBase = 'https://registry.test/assert';
    const mockFetch: typeof fetch = async (input) => {
      const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (u.endsWith(`/${APP_ID}.app.json`)) {
        return new Response(JSON.stringify(registryJson), {
          status: 200,
          headers: { etag: '"a1"' },
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
  });

  afterAll(async () => {
    setAppRegistryServiceForTests(undefined);
    await disconnectReplayStoreForTests();
    await destroyApiTestDataSources();
  });

  it('returns app_assertion_required when Authorization is missing on POST /v1/standard/*', async () => {
    for (const pathname of [STANDARD_MBRSS_OPENAPI_PATH, STANDARD_MB_V1_OPENAPI_PATH]) {
      const res = await request(app)
        .post(pathname)
        .set('Content-Type', 'application/json')
        .send('{}')
        .expect(401);
      expect(res.body.errorCode).toBe('app_assertion_required');
    }
  });

  it('returns app_assertion_replay when jti is reused', async () => {
    for (const pathname of [STANDARD_MBRSS_OPENAPI_PATH, STANDARD_MB_V1_OPENAPI_PATH]) {
      const raw = '{}';
      const jti = randomUUID();
      const token = await signAppAssertionForTests({
        privateKeyPem,
        appId: APP_ID,
        pathname,
        rawBodyUtf8: raw,
        jti,
      });
      await request(app)
        .post(pathname)
        .set('Content-Type', 'application/json')
        .set('Authorization', `AppAssertion ${token}`)
        .send(raw)
        .expect(404);

      const replay = await request(app)
        .post(pathname)
        .set('Content-Type', 'application/json')
        .set('Authorization', `AppAssertion ${token}`)
        .send(raw)
        .expect(409);
      expect(replay.body.errorCode).toBe('app_assertion_replay');
    }
  });

  it('returns app_suspended when registry status is suspended', async () => {
    const suspendedJson = { ...registryJson, status: 'suspended' };
    const registryBase = 'https://registry.test/assert';
    const mockFetch: typeof fetch = async (input) => {
      const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (u.endsWith(`/${APP_ID}.app.json`)) {
        return new Response(JSON.stringify(suspendedJson), {
          status: 200,
          headers: { etag: '"a2"' },
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

    for (const pathname of [STANDARD_MBRSS_OPENAPI_PATH, STANDARD_MB_V1_OPENAPI_PATH]) {
      const raw = '{}';
      const token = await signAppAssertionForTests({
        privateKeyPem,
        appId: APP_ID,
        pathname,
        rawBodyUtf8: raw,
      });
      const res = await request(app)
        .post(pathname)
        .set('Content-Type', 'application/json')
        .set('Authorization', `AppAssertion ${token}`)
        .send(raw)
        .expect(403);
      expect(res.body.errorCode).toBe('app_suspended');
    }
  });
});
