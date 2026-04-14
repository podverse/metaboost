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
import { hashPassword } from '../lib/auth/hash.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'mb1-contract';

function buildRssXml(input: {
  podcastGuid: string;
  items: Array<{ title: string; guid: string; pubDate: string }>;
}): string {
  const itemTags = input.items
    .map(
      (item) =>
        `<item><title>${item.title}</title><guid>${item.guid}</guid><pubDate>${item.pubDate}</pubDate></item>`
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>MB1 Reparse Channel ${input.podcastGuid}</title>
    <podcast:guid>${input.podcastGuid}</podcast:guid>
    ${itemTags}
  </channel>
</rss>`;
}

function mockFeedFetchOnce(xml: string): void {
  vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
    return new Response(xml, {
      status: 200,
      headers: { 'content-type': 'application/rss+xml' },
    });
  });
}

describe('mb1 spec contract routes', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let publicBucketShortId: string;
  let privateBucketShortId: string;
  let channelGuid: string;
  let itemGuid: string;
  let itemBucketId: string;

  beforeAll(async () => {
    app = await createApiTestApp();
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-owner-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'MB1 Owner',
    });
    const publicBucket = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: 'MB1 Public Bucket',
      isPublic: true,
    });
    const privateBucket = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: 'MB1 Private Bucket',
      isPublic: false,
    });
    const itemBucket = await BucketService.createRssItem({
      ownerId: owner.id,
      name: 'MB1 Item Bucket',
      isPublic: true,
      parentBucketId: publicBucket.id,
    });

    channelGuid = `channel-${publicBucket.shortId}`;
    itemGuid = `item-${publicBucket.shortId}`;
    await BucketRSSChannelInfoService.upsert({
      bucketId: publicBucket.id,
      rssPodcastGuid: channelGuid,
      rssChannelTitle: 'MB1 Test Channel',
    });
    await BucketRSSItemInfoService.upsert({
      bucketId: itemBucket.id,
      parentRssChannelBucketId: publicBucket.id,
      rssItemGuid: itemGuid,
    });
    itemBucketId = itemBucket.id;

    publicBucketShortId = publicBucket.shortId;
    privateBucketShortId = privateBucket.shortId;
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await destroyApiTestDataSources();
  });

  it('GET /s/mb1/boost/:bucketShortId returns mb1 capability fields', async () => {
    const res = await request(app).get(`${API}/s/mb1/boost/${publicBucketShortId}`).expect(200);
    expect(res.body.schema).toBe('mb1');
    expect(typeof res.body.message_char_limit).toBe('number');
    expect(res.body.terms_of_service_url).toBe(config.messagesTermsOfServiceUrl);
    expect(typeof res.body.schema_definition_url).toBe('string');
    expect(res.body.schema_definition_url).toContain('/v1/s/mb1/openapi.json');
    expect(typeof res.body.public_messages_url).toBe('string');
    expect(res.body.public_messages_url).toContain(
      `/v1/s/mb1/messages/public/${publicBucketShortId}`
    );
  });

  it('GET /s/mb1/boost/:bucketShortId omits public_messages_url for private bucket', async () => {
    const res = await request(app).get(`${API}/s/mb1/boost/${privateBucketShortId}`).expect(200);
    expect(res.body.schema).toBe('mb1');
    expect(res.body.public_messages_url).toBeUndefined();
  });

  it('GET /s/mb1/boost/:bucketShortId returns 404 for non-rss-channel bucket', async () => {
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-non-rss-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'Non RSS Owner',
    });
    const nonRssBucket = await BucketService.createGroup({
      ownerId: owner.id,
      name: 'Non RSS Bucket',
      isPublic: true,
    });
    await request(app).get(`${API}/s/mb1/boost/${nonRssBucket.shortId}`).expect(404);
  });

  it('POST /s/mb1/boost/:bucketShortId returns 400 when feed_guid does not match expected value', async () => {
    await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'USD',
        amount: 10.5,
        action: 'boost',
        app_name: 'Test App',
        feed_guid: 'mismatch',
        feed_title: 'Test Feed',
      })
      .expect(400);
  });

  it('POST /s/mb1/boost/:bucketShortId validates item_guid and item_title dependency', async () => {
    const res = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'USD',
        amount: 10.5,
        action: 'boost',
        app_name: 'Test App',
        feed_guid: channelGuid,
        feed_title: 'Test Feed',
        item_guid: 'item-1',
      })
      .expect(400);
    expect(res.body.message).toBe('Validation failed');
  });

  it('POST /s/mb1/boost/:bucketShortId returns message_guid when body is valid', async () => {
    const res = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'USD',
        amount: 10.5,
        amount_unit: 'cents',
        action: 'boost',
        app_name: 'Test App',
        sender_name: 'Alice',
        feed_guid: channelGuid,
        feed_title: 'Test Feed',
        message: 'Hello mb1',
      })
      .expect(201);
    expect(typeof res.body.message_guid).toBe('string');
  });

  it('POST /s/mb1/boost/:bucketShortId accepts omitted amount_unit', async () => {
    const res = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'BTC',
        amount: 2500,
        action: 'boost',
        app_name: 'Test App',
        feed_guid: channelGuid,
        feed_title: 'Test Feed',
        message: 'No unit',
      })
      .expect(201);
    expect(typeof res.body.message_guid).toBe('string');
  });

  it('POST /s/mb1/boost/:bucketShortId/confirm-payment accepts message_guid payload', async () => {
    const created = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'USD',
        amount: 1.25,
        action: 'boost',
        app_name: 'Test App',
        feed_guid: channelGuid,
        feed_title: 'Test Feed',
        message: 'Confirm test',
      })
      .expect(201);
    const res = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}/confirm-payment`)
      .send({
        message_guid: created.body.message_guid as string,
        payment_verified_by_app: true,
      })
      .expect(200);
    expect(res.body.message_guid).toBe(created.body.message_guid);
    expect(res.body.payment_verified_by_app).toBe(true);
  });

  it('POST /s/mb1/boost/:bucketShortId/confirm-payment supports item-scoped messages and is idempotent', async () => {
    const created = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'USD',
        amount: 2.25,
        action: 'boost',
        app_name: 'Test App',
        feed_guid: channelGuid,
        feed_title: 'Test Feed',
        item_guid: itemGuid,
        item_title: 'Episode 1',
      })
      .expect(201);

    const first = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}/confirm-payment`)
      .send({
        message_guid: created.body.message_guid as string,
        payment_verified_by_app: true,
      })
      .expect(200);
    expect(first.body.payment_verified_by_app).toBe(true);

    const second = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}/confirm-payment`)
      .send({
        message_guid: created.body.message_guid as string,
        payment_verified_by_app: true,
      })
      .expect(200);
    expect(second.body.message_guid).toBe(created.body.message_guid);
    expect(second.body.payment_verified_by_app).toBe(true);
  });

  it('GET /s/mb1/messages/public/:bucketShortId returns public messages list', async () => {
    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}`)
      .expect(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('GET /s/mb1/messages/public/:bucketShortId/channel/:podcastGuid returns scoped list', async () => {
    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}/channel/${channelGuid}`)
      .expect(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('GET /s/mb1/messages/public/:bucketShortId/item/:itemGuid returns scoped list', async () => {
    await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'USD',
        amount: 3.5,
        action: 'boost',
        app_name: 'Test App',
        feed_guid: channelGuid,
        feed_title: 'Test Feed',
        item_guid: itemGuid,
        item_title: 'Episode 1',
        message: 'Item message',
      })
      .expect(201);
    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}/item/${itemGuid}`)
      .expect(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('GET /s/mb1/messages/public/:bucketShortId excludes unverified messages', async () => {
    await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'USD',
        amount: 2,
        action: 'boost',
        app_name: 'Test App',
        feed_guid: channelGuid,
        feed_title: 'Test Feed',
        message: 'Unverified should be hidden',
      })
      .expect(201);

    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}`)
      .expect(200);
    const hasUnverified = (res.body.messages as Array<{ body?: string }>).some(
      (m) => m.body === 'Unverified should be hidden'
    );
    expect(hasUnverified).toBe(false);
  });

  it('GET /s/mb1/messages/public/:bucketShortId excludes stream action rows', async () => {
    const publicBucket = await BucketService.findByShortId(publicBucketShortId);
    if (publicBucket === null) {
      throw new Error('Expected public bucket to exist');
    }
    await BucketMessageService.create({
      bucketId: publicBucket.id,
      senderName: 'Stream Sender',
      body: 'Stream row should be hidden',
      currency: 'USD',
      amount: 1,
      action: 'stream',
      appName: 'test-suite',
      paymentVerifiedByApp: true,
      isPublic: true,
    });

    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}`)
      .expect(200);
    const hasStream = (res.body.messages as Array<{ body?: string; action?: string }>).some(
      (message) => message.body === 'Stream row should be hidden' || message.action === 'stream'
    );
    expect(hasStream).toBe(false);
  });

  it('GET /s/mb1/messages/public/:bucketShortId/item/:itemGuid excludes stream action rows', async () => {
    await BucketMessageService.create({
      bucketId: itemBucketId,
      senderName: 'Item Stream Sender',
      body: 'Item stream row should be hidden',
      currency: 'USD',
      amount: 1,
      action: 'stream',
      appName: 'test-suite',
      paymentVerifiedByApp: true,
      isPublic: true,
    });

    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}/item/${itemGuid}`)
      .expect(200);
    const hasStream = (res.body.messages as Array<{ body?: string; action?: string }>).some(
      (message) =>
        message.body === 'Item stream row should be hidden' || message.action === 'stream'
    );
    expect(hasStream).toBe(false);
  });

  it('POST /s/mb1/boost/:bucketShortId with action=stream persists telemetry but returns no message-sent response', async () => {
    const before = await BucketMessageService.findByBucketId(itemBucketId, {
      actions: ['stream'],
      limit: 200,
    });
    const res = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'USD',
        amount: 1,
        action: 'stream',
        app_name: 'Test App',
        feed_guid: channelGuid,
        feed_title: 'Test Feed',
        item_guid: itemGuid,
        item_title: 'Episode 1',
        app_version: '1.2.3',
        sender_id: 'stream-sender-id',
        podcast_index_feed_id: 12345,
        time_position: 33,
      })
      .expect(200);
    expect(res.body.action).toBe('stream');
    expect(res.body.message_sent).toBe(false);
    expect(res.body.message_guid).toBeUndefined();
    const after = await BucketMessageService.findByBucketId(itemBucketId, {
      actions: ['stream'],
      limit: 200,
    });
    expect(after.length).toBe(before.length + 1);
    const created = after[0];
    if (created === undefined) {
      throw new Error('Expected stream telemetry message to be persisted');
    }
    expect(created.currency).toBe('USD');
    expect(created.appName).toBe('Test App');
    expect(created.appVersion).toBe('1.2.3');
    expect(created.senderId).toBe('stream-sender-id');
    expect(created.podcastIndexFeedId).toBe(12345);
    expect(Number(created.timePosition)).toBe(33);
  });

  it('POST /s/mb1/boost/:bucketShortId reparses stale channel when item_guid is missing', async () => {
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-reparse-owner-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'MB1 Reparse Owner',
    });
    const channelBucket = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: `Reparse Channel ${Date.now()}`,
      isPublic: true,
    });
    const feedGuid = `reparse-feed-guid-${Date.now()}`;
    const itemGuid = `reparse-item-guid-${Date.now()}`;
    await BucketRSSChannelInfoService.upsert({
      bucketId: channelBucket.id,
      rssFeedUrl: `https://example.com/reparse-${Date.now()}.xml`,
      rssPodcastGuid: feedGuid,
      rssChannelTitle: 'Reparse Channel',
      rssLastParseAttempt: new Date(Date.now() - config.rssParseMinIntervalMs - 1000),
    });

    mockFeedFetchOnce(
      buildRssXml({
        podcastGuid: feedGuid,
        items: [
          { title: 'Reparse Episode', guid: itemGuid, pubDate: 'Mon, 11 Apr 2026 10:00:00 GMT' },
        ],
      })
    );
    const res = await request(app)
      .post(`${API}/s/mb1/boost/${channelBucket.shortId}`)
      .send({
        currency: 'USD',
        amount: 5,
        action: 'boost',
        app_name: 'Test App',
        feed_guid: feedGuid,
        feed_title: 'Reparse Feed',
        item_guid: itemGuid,
        item_title: 'Reparse Episode',
      })
      .expect(201);
    expect(typeof res.body.message_guid).toBe('string');
  });

  it('POST /s/mb1/boost/:bucketShortId returns clear not-found when stale reparse still misses item_guid', async () => {
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-reparse-miss-owner-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'MB1 Reparse Miss Owner',
    });
    const channelBucket = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: `Reparse Miss Channel ${Date.now()}`,
      isPublic: true,
    });
    const feedGuid = `reparse-miss-feed-guid-${Date.now()}`;
    const missingItemGuid = `reparse-missing-item-guid-${Date.now()}`;
    await BucketRSSChannelInfoService.upsert({
      bucketId: channelBucket.id,
      rssFeedUrl: `https://example.com/reparse-miss-${Date.now()}.xml`,
      rssPodcastGuid: feedGuid,
      rssChannelTitle: 'Reparse Miss Channel',
      rssLastParseAttempt: new Date(Date.now() - config.rssParseMinIntervalMs - 1000),
    });

    mockFeedFetchOnce(
      buildRssXml({
        podcastGuid: feedGuid,
        items: [
          {
            title: 'Different Episode',
            guid: `different-guid-${Date.now()}`,
            pubDate: 'Mon, 11 Apr 2026 10:00:00 GMT',
          },
        ],
      })
    );
    const res = await request(app)
      .post(`${API}/s/mb1/boost/${channelBucket.shortId}`)
      .send({
        currency: 'USD',
        amount: 5,
        action: 'boost',
        app_name: 'Test App',
        feed_guid: feedGuid,
        feed_title: 'Reparse Feed',
        item_guid: missingItemGuid,
        item_title: 'Missing Episode',
      })
      .expect(404);
    expect(res.body.message).toBe('RSS item bucket not found for item_guid');
    expect(res.body.errors?.[0]?.message).toContain('after latest parse check');
  });
});
