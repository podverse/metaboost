import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BucketService, UserService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { AppRegistryService } from '../lib/appRegistry/AppRegistryService.js';
import { setAppRegistryServiceForTests } from '../lib/appRegistry/singleton.js';
import { hashPassword } from '../lib/auth/hash.js';
import { GlobalBlockedAppService } from '@metaboost/orm';
import { signAppAssertionForTests } from './helpers/appAssertionSign.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'bucket-blocked-apps';
const APP_ID = 'blocked-apps-test';
const SENDER_GUID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('bucket blocked apps', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let rootBucketId = '';
  let rootBucketShortId = '';
  let childBucketShortId = '';
  let privateKeyPem = '';
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password`;

  beforeAll(async () => {
    const pair = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
    privateKeyPem = Buffer.from(await exportPKCS8(pair.privateKey)).toString('utf8');
    const pubJwk = await exportJWK(pair.publicKey);
    if (typeof pubJwk.x !== 'string') {
      throw new Error('Expected Ed25519 public JWK x');
    }
    const registryJson = {
      app_id: APP_ID,
      display_name: 'Blocked Apps Test',
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
      if (u.endsWith(`/${APP_ID}.app.json`)) {
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
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'Blocked Apps Owner',
    });
    const root = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: `${FILE_PREFIX}-root`,
      isPublic: true,
    });
    const child = await BucketService.createMbMid({
      ownerId: owner.id,
      parentBucketId: root.id,
      name: `${FILE_PREFIX}-child`,
      isPublic: true,
    });
    rootBucketId = root.id;
    rootBucketShortId = root.shortId;
    childBucketShortId = child.shortId;
  });

  afterAll(async () => {
    setAppRegistryServiceForTests(undefined);
    await destroyApiTestDataSources();
  });

  it('pre-check and POST enforce bucket/global app blocks', async () => {
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });

    await agent
      .post(`${API}/buckets/${rootBucketId}/blocked-apps`)
      .send({ appId: APP_ID, appNameSnapshot: 'Blocked Apps Test' })
      .expect(201);

    const bucketBlockedPrecheck = await request(app)
      .get(`${API}/standard/mb-v1/boost/${childBucketShortId}`)
      .query({ app_id: APP_ID })
      .expect(200);
    expect(bucketBlockedPrecheck.body.app_allowed).toBe(false);
    expect(bucketBlockedPrecheck.body.app_block_reason).toBe('app_bucket_blocked');

    const blockedBody = {
      currency: 'USD',
      amount: 1,
      amount_unit: 'dollars',
      action: 'boost',
      app_name: 'Blocked Apps Test',
      sender_name: 'App Sender',
      sender_guid: SENDER_GUID,
      message: 'blocked by bucket',
    };
    const blockedPath = `${API}/standard/mb-v1/boost/${childBucketShortId}`;
    const blockedRaw = JSON.stringify(blockedBody);
    const blockedToken = await signAppAssertionForTests({
      privateKeyPem,
      appId: APP_ID,
      pathname: blockedPath,
      rawBodyUtf8: blockedRaw,
    });
    const blockedRes = await request(app)
      .post(blockedPath)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${blockedToken}`)
      .send(blockedRaw)
      .expect(403);
    expect(blockedRes.body.code).toBe('app_bucket_blocked');

    const blockedList = await agent.get(`${API}/buckets/${rootBucketId}/blocked-apps`).expect(200);
    const rowId = (blockedList.body.blockedApps[0] as { id: string }).id;
    await agent.delete(`${API}/buckets/${rootBucketId}/blocked-apps/${rowId}`).expect(204);

    await GlobalBlockedAppService.addOrUpdate(APP_ID, 'global ban');
    const globalBlockedPrecheck = await request(app)
      .get(`${API}/standard/mb-v1/boost/${rootBucketShortId}`)
      .query({ app_id: APP_ID })
      .expect(200);
    expect(globalBlockedPrecheck.body.app_allowed).toBe(false);
    expect(globalBlockedPrecheck.body.app_block_reason).toBe('app_global_blocked');
  });
});
