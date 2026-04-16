import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  BucketMessageService,
  BucketRSSChannelInfoService,
  BucketService,
  UserService,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'mb1-contract';

describe('mb1 spec contract routes', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let publicBucketShortId: string;
  let privateBucketShortId: string;
  let channelGuid: string;

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

    channelGuid = `channel-${publicBucket.shortId}`;
    await BucketRSSChannelInfoService.upsert({
      bucketId: publicBucket.id,
      rssPodcastGuid: channelGuid,
      rssChannelTitle: 'MB1 Test Channel',
    });

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
  });

  it('GET /s/mb1/boost/:bucketShortId omits public_messages_url for private bucket', async () => {
    const res = await request(app).get(`${API}/s/mb1/boost/${privateBucketShortId}`).expect(200);
    expect(res.body.schema).toBe('mb1');
    expect(res.body.public_messages_url).toBeUndefined();
  });

  it('POST /s/mb1/boost/:bucketShortId rejects feed_guid mismatches', async () => {
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

  it('POST /s/mb1/boost/:bucketShortId returns message_guid for boost and lists immediately', async () => {
    const created = await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'BTC',
        amount: 2500,
        amount_unit: 'satoshis',
        action: 'boost',
        app_name: 'Test App',
        sender_name: 'Alice',
        feed_guid: channelGuid,
        feed_title: 'Test Feed',
        message: 'Immediate public message',
      })
      .expect(201);

    expect(typeof created.body.message_guid).toBe('string');

    const listRes = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}`)
      .expect(200);
    const target = (listRes.body.messages as Array<Record<string, unknown>>).find(
      (message) => message.id === created.body.message_guid
    );
    expect(target).toBeDefined();
    expect(target?.body).toBe('Immediate public message');
    expect(target?.currency).toBe('BTC');
    expect(target?.amountUnit).toBe('satoshis');
    expect(target?.appName).toBe('Test App');
  });

  it('POST /s/mb1/boost/:bucketShortId with action=stream stores telemetry and returns no message guid', async () => {
    const bucket = await BucketService.findByShortId(publicBucketShortId);
    if (bucket === null) {
      throw new Error('Expected public bucket to exist');
    }
    const before = await BucketMessageService.findByBucketId(bucket.id, {
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
      })
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

  it('GET /s/mb1/messages/public/:bucketShortId excludes stream rows', async () => {
    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}`)
      .expect(200);
    const hasStream = (res.body.messages as Array<{ action?: string }>).some(
      (message) => message.action === 'stream'
    );
    expect(hasStream).toBe(false);
  });

  it('nested rss-channel uses channel message limit for MB1 and public bucket, not root network', async () => {
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-nested-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'MB1 Nested Owner',
    });
    const network = await BucketService.createRssNetwork({
      ownerId: owner.id,
      name: 'MB1 Nested Network',
      isPublic: true,
    });
    await BucketService.update(network.id, { messageBodyMaxLength: 500 });
    const channel = await BucketService.createRssChannel({
      ownerId: owner.id,
      name: 'MB1 Nested Channel',
      isPublic: true,
      parentBucketId: network.id,
    });
    await BucketService.update(channel.id, { messageBodyMaxLength: 567 });
    await BucketRSSChannelInfoService.upsert({
      bucketId: channel.id,
      rssPodcastGuid: `nested-guid-${channel.shortId}`,
      rssChannelTitle: 'MB1 Nested Channel Title',
    });

    const boostRes = await request(app).get(`${API}/s/mb1/boost/${channel.shortId}`).expect(200);
    expect(boostRes.body.message_char_limit).toBe(567);

    const publicRes = await request(app)
      .get(`${API}/buckets/public/${channel.shortId}`)
      .expect(200);
    expect(publicRes.body.bucket.messageBodyMaxLength).toBe(567);
  });
});
