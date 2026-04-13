import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BucketService, UserService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'mb1-contract';

describe('mb1 spec contract routes', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let publicBucketShortId: string;
  let privateBucketShortId: string;

  beforeAll(async () => {
    app = await createApiTestApp();
    const owner = await UserService.create({
      email: `${FILE_PREFIX}-owner-${Date.now()}@example.com`,
      password: await hashPassword(`${FILE_PREFIX}-password`),
      displayName: 'MB1 Owner',
    });
    const publicBucket = await BucketService.create({
      ownerId: owner.id,
      name: 'MB1 Public Bucket',
      isPublic: true,
    });
    const privateBucket = await BucketService.create({
      ownerId: owner.id,
      name: 'MB1 Private Bucket',
      isPublic: false,
    });
    publicBucketShortId = publicBucket.shortId;
    privateBucketShortId = privateBucket.shortId;
  });

  afterAll(async () => {
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

  it('POST /s/mb1/boost/:bucketShortId returns 400 when feed_guid does not match expected value', async () => {
    await request(app)
      .post(`${API}/s/mb1/boost/${publicBucketShortId}`)
      .send({
        currency: 'USD',
        amount: 10.5,
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
        app_name: 'Test App',
        feed_guid: publicBucketShortId,
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
        app_name: 'Test App',
        sender_name: 'Alice',
        feed_guid: publicBucketShortId,
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
        app_name: 'Test App',
        feed_guid: publicBucketShortId,
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
        app_name: 'Test App',
        feed_guid: publicBucketShortId,
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

  it('GET /s/mb1/messages/public/:bucketShortId returns public messages list', async () => {
    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}`)
      .expect(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('GET /s/mb1/messages/public/:bucketShortId/channel/:podcastGuid returns scoped list', async () => {
    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}/channel/channel-guid-1`)
      .expect(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('GET /s/mb1/messages/public/:bucketShortId/item/:itemGuid returns scoped list', async () => {
    const res = await request(app)
      .get(`${API}/s/mb1/messages/public/${publicBucketShortId}/item/item-guid-1`)
      .expect(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });
});
