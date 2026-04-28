import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  BucketRSSChannelInfoService,
  BucketService,
  GlobalBlockedAppService,
  UserTermsAcceptanceService,
  UserService,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { AppRegistryService } from '../lib/appRegistry/AppRegistryService.js';
import { setAppRegistryServiceForTests } from '../lib/appRegistry/singleton.js';
import { hashPassword } from '../lib/auth/hash.js';
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
  let rootBucketIdText = '';
  let childBucketIdText = '';
  let rssChannelBucketIdText = '';
  let rssChannelGuid = '';
  let privateKeyPem = '';
  let registryPubJwkX = '';
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password`;

  beforeAll(async () => {
    const pair = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
    privateKeyPem = Buffer.from(await exportPKCS8(pair.privateKey)).toString('utf8');
    const pubJwk = await exportJWK(pair.publicKey);
    if (typeof pubJwk.x !== 'string') {
      throw new Error('Expected Ed25519 public JWK x');
    }
    registryPubJwkX = pubJwk.x;
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

    await GlobalBlockedAppService.deleteByAppId(APP_ID);

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
    rootBucketIdText = root.idText;
    childBucketIdText = child.idText;

    await UserTermsAcceptanceService.recordAcceptanceForCurrentVersion(owner.id);

    const rssChannel = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: `${FILE_PREFIX}-rss-channel`,
      isPublic: true,
    });
    rssChannelGuid = `rss-${rssChannel.idText}`;
    await BucketRSSChannelInfoService.upsert({
      bucketId: rssChannel.id,
      rssPodcastGuid: rssChannelGuid,
      rssChannelTitle: 'Blocked Apps RSS Channel',
    });
    rssChannelBucketIdText = rssChannel.idText;
  });

  afterAll(async () => {
    setAppRegistryServiceForTests(undefined);
    await destroyApiTestDataSources();
  });

  describe('allowed baseline', () => {
    it('pre-check returns app_allowed true when app is not blocked', async () => {
      const res = await request(app)
        .get(`${API}/standard/mb-v1/boost/${rootBucketIdText}`)
        .query({ app_id: APP_ID })
        .expect(200);
      expect(res.body.app_allowed).toBe(true);
      expect(res.body.app_block_reason).toBeUndefined();
      expect(res.body.app_id_checked).toBe(APP_ID);
    });

    it('mb-v1 POST succeeds with 201 for unblocked app', async () => {
      const body = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Baseline Sender',
        sender_guid: SENDER_GUID,
        message: 'baseline allowed',
      };
      const pathname = `${API}/standard/mb-v1/boost/${rootBucketIdText}`;
      const raw = JSON.stringify(body);
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
        .expect(201);
      expect(typeof res.body.message_guid).toBe('string');
    });

    it('mbrss-v1 POST succeeds with 201 for unblocked app', async () => {
      const body = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'RSS Baseline Sender',
        sender_guid: SENDER_GUID,
        feed_guid: rssChannelGuid,
        feed_title: 'Blocked Apps RSS Channel',
        message: 'rss baseline allowed',
      };
      const pathname = `${API}/standard/mbrss-v1/boost/${rssChannelBucketIdText}`;
      const raw = JSON.stringify(body);
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
        .expect(201);
      expect(typeof res.body.message_guid).toBe('string');
    });
  });

  describe('global block enforcement', () => {
    it('global block prevents mb-v1 POST with 403', async () => {
      await GlobalBlockedAppService.addOrUpdate(APP_ID, 'global block test');

      const body = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Global Block Sender',
        sender_guid: SENDER_GUID,
        message: 'global block test',
      };
      const pathname = `${API}/standard/mb-v1/boost/${rootBucketIdText}`;
      const raw = JSON.stringify(body);
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
      expect(res.body.code).toBe('app_global_blocked');

      await GlobalBlockedAppService.deleteByAppId(APP_ID);
    });

    it('global block pre-check returns app_global_blocked', async () => {
      await GlobalBlockedAppService.addOrUpdate(APP_ID, 'global precheck test');

      const res = await request(app)
        .get(`${API}/standard/mb-v1/boost/${rootBucketIdText}`)
        .query({ app_id: APP_ID })
        .expect(200);
      expect(res.body.app_allowed).toBe(false);
      expect(res.body.app_block_reason).toBe('app_global_blocked');

      await GlobalBlockedAppService.deleteByAppId(APP_ID);
    });

    it('global block prevents mbrss-v1 POST with 403', async () => {
      await GlobalBlockedAppService.addOrUpdate(APP_ID, 'global mbrss test');

      const body = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Global Mbrss Sender',
        sender_guid: SENDER_GUID,
        feed_guid: rssChannelGuid,
        feed_title: 'Blocked Apps RSS Channel',
        message: 'global block mbrss test',
      };
      const pathname = `${API}/standard/mbrss-v1/boost/${rssChannelBucketIdText}`;
      const raw = JSON.stringify(body);
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
      expect(res.body.code).toBe('app_global_blocked');

      await GlobalBlockedAppService.deleteByAppId(APP_ID);
    });

    it('app is re-allowed after removing global block', async () => {
      await GlobalBlockedAppService.addOrUpdate(APP_ID, 'temporary global ban');

      const blockedPathname = `${API}/standard/mb-v1/boost/${rootBucketIdText}`;
      const blockedBody = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Reallow Sender',
        sender_guid: SENDER_GUID,
        message: 'reallow after unblock',
      };
      const blockedRaw = JSON.stringify(blockedBody);
      const blockedToken = await signAppAssertionForTests({
        privateKeyPem,
        appId: APP_ID,
        pathname: blockedPathname,
        rawBodyUtf8: blockedRaw,
      });
      await request(app)
        .post(blockedPathname)
        .set('Content-Type', 'application/json')
        .set('Authorization', `AppAssertion ${blockedToken}`)
        .send(blockedRaw)
        .expect(403);

      await GlobalBlockedAppService.deleteByAppId(APP_ID);

      const allowedBody = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Reallow Sender',
        sender_guid: SENDER_GUID,
        message: 'reallowed after unblock',
      };
      const allowedRaw = JSON.stringify(allowedBody);
      const allowedToken = await signAppAssertionForTests({
        privateKeyPem,
        appId: APP_ID,
        pathname: blockedPathname,
        rawBodyUtf8: allowedRaw,
      });
      const res = await request(app)
        .post(blockedPathname)
        .set('Content-Type', 'application/json')
        .set('Authorization', `AppAssertion ${allowedToken}`)
        .send(allowedRaw)
        .expect(201);
      expect(typeof res.body.message_guid).toBe('string');
    });
  });

  describe('bucket block enforcement', () => {
    it('bucket block at root prevents mb-v1 POST to child bucket', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });

      const addRes = await agent
        .post(`${API}/buckets/${rootBucketId}/blocked-apps`)
        .send({ appId: APP_ID, appNameSnapshot: 'Blocked Apps Test' })
        .expect(201);
      const blockedAppId = (addRes.body.blockedApp as { id: string }).id;

      const body = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Bucket Block Child Sender',
        sender_guid: SENDER_GUID,
        message: 'bucket block child test',
      };
      const pathname = `${API}/standard/mb-v1/boost/${childBucketIdText}`;
      const raw = JSON.stringify(body);
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
      expect(res.body.code).toBe('app_bucket_blocked');

      await agent.delete(`${API}/buckets/${rootBucketId}/blocked-apps/${blockedAppId}`).expect(204);
    });

    it('bucket block at root prevents mb-v1 POST to root bucket', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });

      const addRes = await agent
        .post(`${API}/buckets/${rootBucketId}/blocked-apps`)
        .send({ appId: APP_ID, appNameSnapshot: 'Blocked Apps Test' })
        .expect(201);
      const blockedAppId = (addRes.body.blockedApp as { id: string }).id;

      const body = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Bucket Block Root Sender',
        sender_guid: SENDER_GUID,
        message: 'bucket block root test',
      };
      const pathname = `${API}/standard/mb-v1/boost/${rootBucketIdText}`;
      const raw = JSON.stringify(body);
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
      expect(res.body.code).toBe('app_bucket_blocked');

      await agent.delete(`${API}/buckets/${rootBucketId}/blocked-apps/${blockedAppId}`).expect(204);
    });

    it('pre-check on child confirms bucket block', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });

      const addRes = await agent
        .post(`${API}/buckets/${rootBucketId}/blocked-apps`)
        .send({ appId: APP_ID, appNameSnapshot: 'Blocked Apps Test' })
        .expect(201);
      const blockedAppId = (addRes.body.blockedApp as { id: string }).id;

      const res = await request(app)
        .get(`${API}/standard/mb-v1/boost/${childBucketIdText}`)
        .query({ app_id: APP_ID })
        .expect(200);
      expect(res.body.app_allowed).toBe(false);
      expect(res.body.app_block_reason).toBe('app_bucket_blocked');

      await agent.delete(`${API}/buckets/${rootBucketId}/blocked-apps/${blockedAppId}`).expect(204);
    });

    it('bucket block prevents mbrss-v1 POST', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });

      const rssChannel = await BucketService.findByIdText(rssChannelBucketIdText);
      const rssRootId =
        rssChannel !== null
          ? ((await BucketService.resolveRootBucketId(rssChannel.id)) ?? rssChannel.id)
          : rootBucketId;

      const addRes = await agent
        .post(`${API}/buckets/${rssRootId}/blocked-apps`)
        .send({ appId: APP_ID, appNameSnapshot: 'Blocked Apps Test' })
        .expect(201);
      const blockedAppId = (addRes.body.blockedApp as { id: string }).id;

      const body = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Bucket Mbrss Sender',
        sender_guid: SENDER_GUID,
        feed_guid: rssChannelGuid,
        feed_title: 'Blocked Apps RSS Channel',
        message: 'bucket block mbrss test',
      };
      const pathname = `${API}/standard/mbrss-v1/boost/${rssChannelBucketIdText}`;
      const raw = JSON.stringify(body);
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
      expect(res.body.code).toBe('app_bucket_blocked');

      await agent.delete(`${API}/buckets/${rssRootId}/blocked-apps/${blockedAppId}`).expect(204);
    });

    it('app is re-allowed after removing bucket block', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });

      const addRes = await agent
        .post(`${API}/buckets/${rootBucketId}/blocked-apps`)
        .send({ appId: APP_ID, appNameSnapshot: 'Blocked Apps Test' })
        .expect(201);
      const blockedAppId = (addRes.body.blockedApp as { id: string }).id;

      const blockedPathname = `${API}/standard/mb-v1/boost/${rootBucketIdText}`;
      const blockedBody = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Bucket Reallow Sender',
        sender_guid: SENDER_GUID,
        message: 'bucket reallow blocked',
      };
      const blockedRaw = JSON.stringify(blockedBody);
      const blockedToken = await signAppAssertionForTests({
        privateKeyPem,
        appId: APP_ID,
        pathname: blockedPathname,
        rawBodyUtf8: blockedRaw,
      });
      await request(app)
        .post(blockedPathname)
        .set('Content-Type', 'application/json')
        .set('Authorization', `AppAssertion ${blockedToken}`)
        .send(blockedRaw)
        .expect(403);

      await agent.delete(`${API}/buckets/${rootBucketId}/blocked-apps/${blockedAppId}`).expect(204);

      const allowedBody = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Bucket Reallow Sender',
        sender_guid: SENDER_GUID,
        message: 'bucket reallowed',
      };
      const allowedRaw = JSON.stringify(allowedBody);
      const allowedToken = await signAppAssertionForTests({
        privateKeyPem,
        appId: APP_ID,
        pathname: blockedPathname,
        rawBodyUtf8: allowedRaw,
      });
      const res = await request(app)
        .post(blockedPathname)
        .set('Content-Type', 'application/json')
        .set('Authorization', `AppAssertion ${allowedToken}`)
        .send(allowedRaw)
        .expect(201);
      expect(typeof res.body.message_guid).toBe('string');
    });
  });

  describe('registry status enforcement', () => {
    const setRegistryStatus = (status: string): void => {
      const revokedJson = {
        app_id: APP_ID,
        display_name: 'Blocked Apps Test',
        owner: { name: 'T', email: 't@example.com' },
        status,
        signing_keys: [
          {
            kty: 'OKP',
            crv: 'Ed25519',
            alg: 'EdDSA',
            x: registryPubJwkX,
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
          return new Response(JSON.stringify(revokedJson), {
            status: 200,
            headers: { etag: `"${status}"` },
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
    };

    it('revoked registry status rejects mb-v1 POST with 403', async () => {
      setRegistryStatus('revoked');

      const body = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Revoked Sender',
        sender_guid: SENDER_GUID,
        message: 'revoked test',
      };
      const pathname = `${API}/standard/mb-v1/boost/${rootBucketIdText}`;
      const raw = JSON.stringify(body);
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

      setRegistryStatus('active');
    });

    it('revoked registry status pre-check returns app_registry_blocked', async () => {
      setRegistryStatus('revoked');

      const res = await request(app)
        .get(`${API}/standard/mb-v1/boost/${rootBucketIdText}`)
        .query({ app_id: APP_ID })
        .expect(200);
      expect(res.body.app_allowed).toBe(false);
      expect(res.body.app_block_reason).toBe('app_registry_blocked');

      setRegistryStatus('active');
    });

    it('revoked registry status rejects mbrss-v1 POST with 403', async () => {
      setRegistryStatus('revoked');

      const body = {
        currency: 'BTC',
        amount: 1000,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Blocked Apps Test',
        sender_name: 'Revoked Mbrss Sender',
        sender_guid: SENDER_GUID,
        feed_guid: rssChannelGuid,
        feed_title: 'Blocked Apps RSS Channel',
        message: 'revoked mbrss test',
      };
      const pathname = `${API}/standard/mbrss-v1/boost/${rssChannelBucketIdText}`;
      const raw = JSON.stringify(body);
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

      setRegistryStatus('active');
    });
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
      .get(`${API}/standard/mb-v1/boost/${childBucketIdText}`)
      .query({ app_id: APP_ID })
      .expect(200);
    expect(bucketBlockedPrecheck.body.app_allowed).toBe(false);
    expect(bucketBlockedPrecheck.body.app_block_reason).toBe('app_bucket_blocked');

    const blockedBody = {
      currency: 'BTC',
      amount: 1000,
      amount_unit: 'satoshis',
      action: 'boost',
      app_name: 'Blocked Apps Test',
      sender_name: 'App Sender',
      sender_guid: SENDER_GUID,
      message: 'blocked by bucket',
    };
    const blockedPath = `${API}/standard/mb-v1/boost/${childBucketIdText}`;
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
      .get(`${API}/standard/mb-v1/boost/${rootBucketIdText}`)
      .query({ app_id: APP_ID })
      .expect(200);
    expect(globalBlockedPrecheck.body.app_allowed).toBe(false);
    expect(globalBlockedPrecheck.body.app_block_reason).toBe('app_global_blocked');

    await GlobalBlockedAppService.deleteByAppId(APP_ID);
  });
});
