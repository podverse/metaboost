import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  BucketMessageService,
  BucketRSSChannelInfoService,
  BucketRSSItemInfoService,
  BucketService,
  UserService,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { AppRegistryService } from '../lib/appRegistry/AppRegistryService.js';
import { setAppRegistryServiceForTests } from '../lib/appRegistry/singleton.js';
import { hashPassword } from '../lib/auth/hash.js';
import { signAppAssertionForTests } from './helpers/appAssertionSign.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'mbrss-v1-contract';
const CONTRACT_SENDER_GUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Matches registry filename `contractmbrss.app.json` (slug pattern). */
const CONTRACT_APP_ID = 'contractmbrss';

describe('mbrss-v1 spec contract routes', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let publicBucketShortId: string;
  let privateBucketShortId: string;
  let channelGuid: string;
  let privateChannelGuid: string;
  let itemGuid: string;
  let contractPrivateKeyPem: string;

  const prepareSignedBoostPost = async (
    bucketShortId: string,
    body: Record<string, unknown>
  ): Promise<{ pathname: string; raw: string; token: string }> => {
    const pathname = `${API}/standard/mbrss-v1/boost/${bucketShortId}`;
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
      displayName: 'Contract Owner',
    });
    const publicBucket = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: 'Contract Public Bucket',
      isPublic: true,
    });
    const privateBucket = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: 'Contract Private Bucket',
      isPublic: false,
    });
    const itemBucket = await BucketService.createRssItem({
      ownerId: owner.id,
      parentBucketId: publicBucket.id,
      name: 'Contract Item Bucket',
      isPublic: true,
    });

    channelGuid = `channel-${publicBucket.shortId}`;
    await BucketRSSChannelInfoService.upsert({
      bucketId: publicBucket.id,
      rssPodcastGuid: channelGuid,
      rssChannelTitle: 'Contract Test Channel',
    });

    privateChannelGuid = `channel-private-${privateBucket.shortId}`;
    await BucketRSSChannelInfoService.upsert({
      bucketId: privateBucket.id,
      rssPodcastGuid: privateChannelGuid,
      rssChannelTitle: 'Contract Private Channel',
    });

    publicBucketShortId = publicBucket.shortId;
    privateBucketShortId = privateBucket.shortId;
    itemGuid = `item-${itemBucket.shortId}`;
    await BucketRSSItemInfoService.upsert({
      bucketId: itemBucket.id,
      parentRssChannelBucketId: publicBucket.id,
      rssItemGuid: itemGuid,
      rssItemPubDate: new Date(),
      orphaned: false,
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    setAppRegistryServiceForTests(undefined);
    await destroyApiTestDataSources();
  });

  it('GET /standard/mbrss-v1/boost/:bucketShortId returns mbrss-v1 capability fields', async () => {
    const res = await request(app)
      .get(`${API}/standard/mbrss-v1/boost/${publicBucketShortId}`)
      .expect(200);
    expect(res.body.schema).toBe('mbrss-v1');
    expect(typeof res.body.message_char_limit).toBe('number');
    expect(res.body.terms_of_service_url).toBe(config.messagesTermsOfServiceUrl);
    expect(typeof res.body.schema_definition_url).toBe('string');
    expect(res.body.schema_definition_url).toContain('/v1/standard/mbrss-v1/openapi.json');
    expect(typeof res.body.public_messages_url).toBe('string');
  });

  it('GET /standard/mbrss-v1/boost/:bucketShortId omits public_messages_url for private bucket', async () => {
    const res = await request(app)
      .get(`${API}/standard/mbrss-v1/boost/${privateBucketShortId}`)
      .expect(200);
    expect(res.body.schema).toBe('mbrss-v1');
    expect(res.body.public_messages_url).toBeUndefined();
  });

  it('POST /standard/mbrss-v1/boost/:bucketShortId rejects feed_guid mismatches', async () => {
    const mismatch = await prepareSignedBoostPost(publicBucketShortId, {
      currency: 'USD',
      amount: 10.5,
      action: 'boost',
      app_name: 'Test App',
      sender_guid: CONTRACT_SENDER_GUID,
      feed_guid: 'mismatch',
      feed_title: 'Test Feed',
    });
    await request(app)
      .post(mismatch.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${mismatch.token}`)
      .send(mismatch.raw)
      .expect(400);
  });

  it('POST /standard/mbrss-v1/boost/:bucketShortId returns message_guid for boost and lists immediately', async () => {
    const boost = await prepareSignedBoostPost(publicBucketShortId, {
      currency: 'BTC',
      amount: 2500,
      amount_unit: 'satoshis',
      action: 'boost',
      app_name: 'Test App',
      sender_name: 'Alice',
      sender_guid: CONTRACT_SENDER_GUID,
      feed_guid: channelGuid,
      feed_title: 'Test Feed',
      message: 'Immediate public message',
    });
    const created = await request(app)
      .post(boost.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${boost.token}`)
      .send(boost.raw)
      .expect(201);

    expect(typeof created.body.message_guid).toBe('string');

    const listRes = await request(app)
      .get(`${API}/standard/mbrss-v1/messages/public/${publicBucketShortId}`)
      .expect(200);
    const target = (listRes.body.messages as Array<Record<string, unknown>>).find(
      (message) => message.id === created.body.message_guid
    );
    expect(target).toBeDefined();
    expect(target?.body).toBe('Immediate public message');
    expect(target?.currency).toBe('BTC');
    expect(target?.amountUnit).toBe('satoshis');
    expect(target?.appName).toBe('Test App');
    expect(target?.senderGuid).toBeUndefined();
    expect(target?.breadcrumbContext ?? null).toBeNull();
  });

  it('GET /standard/mbrss-v1/messages/public/:bucketShortId/channel/:podcastGuid includes item subbucket rows with breadcrumb context', async () => {
    const boost = await prepareSignedBoostPost(publicBucketShortId, {
      currency: 'BTC',
      amount: 3500,
      amount_unit: 'satoshis',
      action: 'boost',
      app_name: 'Channel Item Test',
      sender_name: 'Carol',
      sender_guid: CONTRACT_SENDER_GUID,
      feed_guid: channelGuid,
      feed_title: 'Test Feed',
      item_guid: itemGuid,
      message: 'Item-scoped boost message',
    });
    const created = await request(app)
      .post(boost.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${boost.token}`)
      .send(boost.raw)
      .expect(201);

    const listRes = await request(app)
      .get(`${API}/standard/mbrss-v1/messages/public/${publicBucketShortId}/channel/${channelGuid}`)
      .expect(200);
    const target = (listRes.body.messages as Array<Record<string, unknown>>).find(
      (message) => message.id === created.body.message_guid
    );
    expect(target).toBeDefined();
    expect(target?.senderGuid).toBeUndefined();
    expect((target?.breadcrumbContext as { level?: string } | undefined)?.level).toBe('item');
    expect((target?.breadcrumbContext as { isSubBucket?: boolean } | undefined)?.isSubBucket).toBe(
      true
    );
    expect((target?.breadcrumbContext as { itemGuid?: string } | undefined)?.itemGuid).toBe(
      itemGuid
    );
    expect((target?.breadcrumbContext as { podcastGuid?: string } | undefined)?.podcastGuid).toBe(
      channelGuid
    );
  });

  it('GET /standard/mbrss-v1/messages/public/:bucketShortId/item/:itemGuid returns item rows with null breadcrumbContext', async () => {
    const itemRes = await request(app)
      .get(`${API}/standard/mbrss-v1/messages/public/${publicBucketShortId}/item/${itemGuid}`)
      .expect(200);
    const rows = itemRes.body.messages as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.senderGuid).toBeUndefined();
      expect(row.breadcrumbContext ?? null).toBeNull();
    }
  });

  it('POST /standard/mbrss-v1/boost/:bucketShortId on private bucket does not expose messages via public list', async () => {
    const priv = await prepareSignedBoostPost(privateBucketShortId, {
      currency: 'BTC',
      amount: 1000,
      amount_unit: 'satoshis',
      action: 'boost',
      app_name: 'Private Bucket App',
      sender_name: 'Bob',
      sender_guid: CONTRACT_SENDER_GUID,
      feed_guid: privateChannelGuid,
      feed_title: 'Private Feed',
      message: 'Private channel boost body',
    });
    const created = await request(app)
      .post(priv.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${priv.token}`)
      .send(priv.raw)
      .expect(201);

    const messageId = created.body.message_guid as string;
    const stored = await BucketMessageService.findById(messageId, { actions: ['boost'] });
    expect(stored).not.toBeNull();
    const owningBucket = await BucketService.findById(stored!.bucketId);
    expect(owningBucket?.isPublic).toBe(false);

    await request(app)
      .get(`${API}/standard/mbrss-v1/messages/public/${privateBucketShortId}`)
      .expect(404);
  });

  it('POST /standard/mbrss-v1/boost/:bucketShortId with action=stream stores telemetry and returns no message guid', async () => {
    const bucket = await BucketService.findByShortId(publicBucketShortId);
    if (bucket === null) {
      throw new Error('Expected public bucket to exist');
    }
    const before = await BucketMessageService.findByBucketId(bucket.id, {
      actions: ['stream'],
      limit: 200,
    });
    const stream = await prepareSignedBoostPost(publicBucketShortId, {
      currency: 'USD',
      amount: 1,
      action: 'stream',
      app_name: 'Test App',
      sender_guid: CONTRACT_SENDER_GUID,
      feed_guid: channelGuid,
      feed_title: 'Test Feed',
    });
    const res = await request(app)
      .post(stream.pathname)
      .set('Content-Type', 'application/json')
      .set('Authorization', `AppAssertion ${stream.token}`)
      .send(stream.raw)
      .expect(200);
    expect(res.body.action).toBe('stream');
    expect(res.body.message_sent).toBe(false);
    expect(res.body.message_guid).toBeUndefined();

    const after = await BucketMessageService.findByBucketId(bucket.id, {
      actions: ['stream'],
      limit: 200,
    });
    expect(after.length).toBe(before.length + 1);
  });

  it('GET /standard/mbrss-v1/messages/public/:bucketShortId excludes stream rows', async () => {
    const res = await request(app)
      .get(`${API}/standard/mbrss-v1/messages/public/${publicBucketShortId}`)
      .expect(200);
    const hasStream = (res.body.messages as Array<{ action?: string }>).some(
      (message) => message.action === 'stream'
    );
    expect(hasStream).toBe(false);
  });

  it('GET /standard/mbrss-v1/messages/public/* endpoints apply root threshold baseline and query minimum max behavior', async () => {
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-threshold-owner-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'Mbrss Threshold Owner',
    });
    const channelBucket = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: `Mbrss Threshold Channel ${Date.now()}`,
      isPublic: true,
    });
    const itemBucket = await BucketService.createRssItem({
      ownerId: owner.id,
      parentBucketId: channelBucket.id,
      name: `Mbrss Threshold Item ${Date.now()}`,
      isPublic: true,
    });
    const thresholdChannelGuid = `threshold-channel-${channelBucket.shortId}`;
    const thresholdItemGuid = `threshold-item-${itemBucket.shortId}`;
    await BucketRSSChannelInfoService.upsert({
      bucketId: channelBucket.id,
      rssPodcastGuid: thresholdChannelGuid,
      rssChannelTitle: 'Threshold Channel',
    });
    await BucketRSSItemInfoService.upsert({
      bucketId: itemBucket.id,
      parentRssChannelBucketId: channelBucket.id,
      rssItemGuid: thresholdItemGuid,
      rssItemPubDate: new Date(),
      orphaned: false,
    });
    await BucketService.update(channelBucket.id, { minimumMessageAmountMinor: 200 });

    const channelLowBody = `mbrss-threshold-channel-low-${Date.now()}`;
    const channelHighBody = `mbrss-threshold-channel-high-${Date.now()}`;
    const itemBody = `mbrss-threshold-item-high-${Date.now()}`;
    await BucketMessageService.create({
      bucketId: channelBucket.id,
      senderName: 'Threshold Channel Low',
      body: channelLowBody,
      currency: 'USD',
      amount: 1,
      action: 'boost',
      appName: 'threshold-test',
      usdCentsAtCreate: 150,
    });
    await BucketMessageService.create({
      bucketId: channelBucket.id,
      senderName: 'Threshold Channel High',
      body: channelHighBody,
      currency: 'USD',
      amount: 1,
      action: 'boost',
      appName: 'threshold-test',
      usdCentsAtCreate: 300,
    });
    await BucketMessageService.create({
      bucketId: itemBucket.id,
      senderName: 'Threshold Item High',
      body: itemBody,
      currency: 'USD',
      amount: 1,
      action: 'boost',
      appName: 'threshold-test',
      usdCentsAtCreate: 250,
    });

    const rootList = await request(app)
      .get(`${API}/standard/mbrss-v1/messages/public/${channelBucket.shortId}`)
      .expect(200);
    const rootBodies = (rootList.body.messages as Array<{ body: string | null }>).map(
      (message) => message.body
    );
    expect(rootBodies).toContain(channelHighBody);
    expect(rootBodies).toContain(itemBody);
    expect(rootBodies).not.toContain(channelLowBody);

    const channelTightened = await request(app)
      .get(
        `${API}/standard/mbrss-v1/messages/public/${channelBucket.shortId}/channel/${thresholdChannelGuid}?minimumAmountUsdCents=260`
      )
      .expect(200);
    const channelBodies = (channelTightened.body.messages as Array<{ body: string | null }>).map(
      (message) => message.body
    );
    expect(channelBodies).toContain(channelHighBody);
    expect(channelBodies).not.toContain(itemBody);
    expect(channelBodies).not.toContain(channelLowBody);

    const itemList = await request(app)
      .get(
        `${API}/standard/mbrss-v1/messages/public/${channelBucket.shortId}/item/${thresholdItemGuid}`
      )
      .expect(200);
    const itemBodies = (itemList.body.messages as Array<{ body: string | null }>).map(
      (message) => message.body
    );
    expect(itemBodies).toContain(itemBody);

    const itemTightened = await request(app)
      .get(
        `${API}/standard/mbrss-v1/messages/public/${channelBucket.shortId}/item/${thresholdItemGuid}?minimumAmountUsdCents=260`
      )
      .expect(200);
    expect(itemTightened.body.messages).toHaveLength(0);
  });

  it('nested rss-channel uses channel message limit for ingest and public bucket, not root network', async () => {
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-nested-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'Nested Owner',
    });
    const network = await BucketService.createRssNetwork({
      ownerId: owner.id,
      name: 'Nested Network',
      isPublic: true,
    });
    await BucketService.update(network.id, { messageBodyMaxLength: 500 });
    const channel = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: 'Nested Channel',
      isPublic: true,
      parentBucketId: network.id,
    });
    await BucketService.update(channel.id, { messageBodyMaxLength: 567 });
    await BucketRSSChannelInfoService.upsert({
      bucketId: channel.id,
      rssPodcastGuid: `nested-guid-${channel.shortId}`,
      rssChannelTitle: 'Nested Channel Title',
    });

    const boostRes = await request(app)
      .get(`${API}/standard/mbrss-v1/boost/${channel.shortId}`)
      .expect(200);
    expect(boostRes.body.message_char_limit).toBe(567);

    const publicRes = await request(app)
      .get(`${API}/buckets/public/${channel.shortId}`)
      .expect(200);
    expect(publicRes.body.bucket.messageBodyMaxLength).toBe(567);
  });
});
