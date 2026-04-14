/**
 * API integration tests: buckets CRUD endpoints.
 * Covers list, get, create, update, delete and auth/validation errors.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { BucketMessageService, BucketService, UserService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'buckets';
const SAMPLE_RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>Sample RSS Channel</title>
    <podcast:guid>feed-guid-${FILE_PREFIX}</podcast:guid>
    <podcast:metaBoost standard="mb1">https://example.com/s/mb1/boost/channel</podcast:metaBoost>
    <item>
      <title>Episode One</title>
      <guid>episode-guid-001</guid>
      <pubDate>Mon, 11 Apr 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

function mockFeedFetchOnce(xml: string, ok = true): void {
  vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
    return new Response(xml, {
      status: ok ? 200 : 500,
      headers: { 'content-type': 'application/rss+xml' },
    });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRequiredStringField(value: unknown, fieldName: string): string {
  if (!isRecord(value) || !(fieldName in value)) {
    throw new Error(`Expected field "${fieldName}" in response body`);
  }
  const fieldValue = value[fieldName];
  if (typeof fieldValue !== 'string' || fieldValue === '') {
    throw new Error(`Expected non-empty string field "${fieldName}" in response body`);
  }
  return fieldValue;
}

describe('buckets', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password-1`;
  let bucketShortId: string;

  beforeAll(async () => {
    app = await createApiTestApp();
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'Bucket Owner',
    });
    const bucket = await BucketService.create({
      ownerId: owner.id,
      name: 'Existing Bucket',
    });
    bucketShortId = bucket.shortId;
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await destroyApiTestDataSources();
  });

  describe('GET /buckets', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).get(`${API}/buckets`).expect(401);
    });

    it('returns 200 with buckets array when authenticated', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent.get(`${API}/buckets`).expect(200);
      expect(Array.isArray(res.body.buckets)).toBe(true);
      expect(res.body.buckets.length).toBeGreaterThanOrEqual(1);
      const found = res.body.buckets.find((b: { shortId: string }) => b.shortId === bucketShortId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Existing Bucket');
    });
  });

  describe('POST /buckets', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).post(`${API}/buckets`).send({ name: 'New' }).expect(401);
    });

    it('returns 400 when name is missing', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent.post(`${API}/buckets`).send({ type: 'group' }).expect(400);
    });

    it('creates top-level group bucket', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent
        .post(`${API}/buckets`)
        .send({ type: 'group', name: `${FILE_PREFIX}-new-${Date.now()}` })
        .expect(201);
      expect(res.body.bucket).toBeDefined();
      expect(res.body.bucket).toHaveProperty('id');
      expect(res.body.bucket).toHaveProperty('shortId');
      expect(res.body.bucket).toHaveProperty('name');
      expect(res.body.bucket).toHaveProperty('ownerId');
      expect(res.body.bucket.type).toBe('group');
      expect(res.body.bucket.rss).toBeNull();
    });

    it('creates top-level rss-channel bucket from rss_feed_url', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      mockFeedFetchOnce(SAMPLE_RSS_XML);
      const res = await agent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/feed-${Date.now()}.xml`,
        })
        .expect(201);

      expect(res.body.bucket.type).toBe('rss-channel');
      expect(res.body.bucket.name).toBe('Sample RSS Channel');
      expect(res.body.bucket.rss).toBeDefined();
      expect(res.body.bucket.rss.rssPodcastGuid).toBe(`feed-guid-${FILE_PREFIX}`);
      expect(res.body.bucket.rss.rssFeedUrl).toContain('https://example.com/feed-');
    });

    it('returns 400 with clear rss field error when required RSS fields are missing', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      mockFeedFetchOnce(
        `<?xml version="1.0"?><rss><channel><title>Missing Guid</title></channel></rss>`
      );
      const res = await agent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/missing-guid-${Date.now()}.xml`,
        })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details[0]?.path).toBe('rssFeedUrl');
    });
  });

  describe('POST /buckets/:bucketId/buckets', () => {
    it('creates rss-channel child under group parent', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-parent-owner-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'Parent Owner',
      });
      const parentGroup = await BucketService.createGroup({
        ownerId: owner.id,
        name: 'Parent Group',
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      mockFeedFetchOnce(
        SAMPLE_RSS_XML.replace(`feed-guid-${FILE_PREFIX}`, `feed-guid-child-${Date.now()}`)
      );
      const res = await agent
        .post(`${API}/buckets/${parentGroup.shortId}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/child-feed-${Date.now()}.xml`,
        })
        .expect(201);
      expect(res.body.bucket.type).toBe('rss-channel');
      expect(res.body.bucket.parentBucketId).toBe(parentGroup.id);
    });

    it('rejects group-under-group (invalid child type)', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${bucketShortId}/buckets`)
        .send({ type: 'group', name: 'Invalid Child Group' })
        .expect(400);
    });

    it('rejects child create under rss-channel parent', async () => {
      const hashed = await hashPassword(ownerPassword);
      const rssOwnerEmail = `${FILE_PREFIX}-rss-parent-owner-${Date.now()}@example.com`;
      await UserService.create({
        email: rssOwnerEmail,
        password: hashed,
        displayName: 'RSS Parent Owner',
      });
      mockFeedFetchOnce(
        SAMPLE_RSS_XML.replace(`feed-guid-${FILE_PREFIX}`, `feed-guid-parent-${Date.now()}`)
      );
      const rssOwnerAgent = await createApiLoginAgent(app, {
        email: rssOwnerEmail,
        password: ownerPassword,
      });
      const created = await rssOwnerAgent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/rss-parent-${Date.now()}.xml`,
        })
        .expect(201);
      const rssParentShortId = getRequiredStringField(created.body.bucket, 'shortId');
      mockFeedFetchOnce(
        SAMPLE_RSS_XML.replace(`feed-guid-${FILE_PREFIX}`, `feed-guid-disallowed-${Date.now()}`)
      );
      await rssOwnerAgent
        .post(`${API}/buckets/${rssParentShortId}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/disallowed-${Date.now()}.xml`,
        })
        .expect(400, { message: 'Child buckets can only be created under group buckets.' });
    });

    it('rejects child create under rss-item parent', async () => {
      const hashed = await hashPassword(ownerPassword);
      const itemOwnerEmail = `${FILE_PREFIX}-item-parent-owner-${Date.now()}@example.com`;
      const itemOwner = await UserService.create({
        email: itemOwnerEmail,
        password: hashed,
        displayName: 'Item Parent Owner',
      });
      const rssChannelParent = await BucketService.createRssChannel({
        ownerId: itemOwner.id,
        name: `RSS Channel Parent ${Date.now()}`,
        isPublic: true,
      });
      const rssItemParent = await BucketService.create({
        ownerId: itemOwner.id,
        name: `RSS Item Parent ${Date.now()}`,
        type: 'rss-item',
        isPublic: true,
        parentBucketId: rssChannelParent.id,
      });
      const itemOwnerAgent = await createApiLoginAgent(app, {
        email: itemOwnerEmail,
        password: ownerPassword,
      });
      mockFeedFetchOnce(
        SAMPLE_RSS_XML.replace(
          `feed-guid-${FILE_PREFIX}`,
          `feed-guid-disallowed-item-${Date.now()}`
        )
      );
      await itemOwnerAgent
        .post(`${API}/buckets/${rssItemParent.shortId}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/disallowed-item-${Date.now()}.xml`,
        })
        .expect(400, { message: 'Child buckets can only be created under group buckets.' });
    });
  });

  describe('GET /buckets/:id', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).get(`${API}/buckets/${bucketShortId}`).expect(401);
    });

    it('returns 404 when bucket does not exist', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .get(`${API}/buckets/nonexistent-short-id`)
        .expect(404, { message: 'Bucket not found' });
    });

    it('returns 200 with bucket when authenticated and bucket exists', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent.get(`${API}/buckets/${bucketShortId}`).expect(200);
      expect(res.body.bucket).toBeDefined();
      expect(res.body.bucket.shortId).toBe(bucketShortId);
      expect(res.body.bucket.name).toBe('Existing Bucket');
    });
  });

  describe('PATCH /buckets/:id', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app)
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('returns 404 when bucket does not exist', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .patch(`${API}/buckets/nonexistent-short-id`)
        .send({ name: 'Updated' })
        .expect(404, { message: 'Bucket not found' });
    });

    it('returns 200 with updated bucket when body valid', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const newName = `${FILE_PREFIX}-patched-${Date.now()}`;
      const res = await agent
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ name: newName })
        .expect(200);
      expect(res.body.bucket).toBeDefined();
      expect(res.body.bucket.name).toBe(newName);
      // Restore for other tests that expect original name
      await agent
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ name: 'Existing Bucket' })
        .expect(200);
    });
  });

  describe('DELETE /buckets/:id', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).delete(`${API}/buckets/${bucketShortId}`).expect(401);
    });

    it('returns 404 when bucket does not exist', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .delete(`${API}/buckets/nonexistent-short-id`)
        .expect(404, { message: 'Bucket not found' });
    });

    it('returns 204 when authenticated and bucket exists', async () => {
      const delOwnerEmail = `${FILE_PREFIX}-del-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: delOwnerEmail,
        password: hashed,
        displayName: 'Del Owner',
      });
      const bucket = await BucketService.create({
        ownerId: owner.id,
        name: 'To Delete',
      });
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const delAgent = await createApiLoginAgent(app, {
        email: delOwnerEmail,
        password: ownerPassword,
      });
      await delAgent.delete(`${API}/buckets/${bucket.shortId}`).expect(204);
      await agent.get(`${API}/buckets/${bucket.shortId}`).expect(404);
    });
  });

  describe('removed message write routes', () => {
    it('POST /buckets/public/:id/messages returns 404 (route removed)', async () => {
      await request(app)
        .post(`${API}/buckets/public/${bucketShortId}/messages`)
        .send({ senderName: 'Removed Route', body: 'Should not be accepted' })
        .expect(404);
    });

    it('POST /buckets/:bucketId/messages returns 404 (route removed)', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${bucketShortId}/messages`)
        .send({ senderName: 'Removed Route', body: 'Should not be accepted' })
        .expect(404);
    });

    it('PATCH /buckets/:bucketId/messages/:id returns 404 (route removed)', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .patch(`${API}/buckets/${bucketShortId}/messages/00000000-0000-4000-a000-000000000000`)
        .send({ body: 'Should not be accepted' })
        .expect(404);
    });
  });

  describe('message retrieval excludes stream action rows', () => {
    it('GET /buckets/:bucketId/messages returns only boost messages', async () => {
      const bucket = await BucketService.findByShortId(bucketShortId);
      expect(bucket).not.toBeNull();
      if (bucket === null) {
        throw new Error('Expected test bucket to exist');
      }
      const targetBucketId = bucket.id;
      const boostBody = `boost-visible-${Date.now()}`;
      const streamBody = `stream-hidden-${Date.now()}`;
      await BucketMessageService.create({
        bucketId: targetBucketId,
        senderName: 'Boost Sender',
        body: boostBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'test-suite',
        isPublic: true,
      });
      const streamMessage = await BucketMessageService.create({
        bucketId: targetBucketId,
        senderName: 'Stream Sender',
        body: streamBody,
        currency: 'USD',
        amount: 1,
        action: 'stream',
        appName: 'test-suite',
        isPublic: true,
      });

      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent.get(`${API}/buckets/${bucketShortId}/messages`).expect(200);
      const messages = res.body.messages as Array<{ id: string; body: string; action?: string }>;
      expect(messages.some((m) => m.body === boostBody)).toBe(true);
      expect(messages.some((m) => m.id === streamMessage.id)).toBe(false);
      expect(messages.some((m) => m.body === streamBody)).toBe(false);
      expect(messages.some((m) => m.action === 'stream')).toBe(false);
    });

    it('GET /buckets/:bucketId/messages/:id returns 404 for stream action message', async () => {
      const bucket = await BucketService.findByShortId(bucketShortId);
      expect(bucket).not.toBeNull();
      const streamMessage = await BucketMessageService.create({
        bucketId: bucket!.id,
        senderName: 'Stream Sender',
        body: `stream-get-hidden-${Date.now()}`,
        currency: 'USD',
        amount: 1,
        action: 'stream',
        appName: 'test-suite',
        isPublic: true,
      });

      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent.get(`${API}/buckets/${bucketShortId}/messages/${streamMessage.id}`).expect(404, {
        message: 'Message not found',
      });
    });

    it('GET /buckets/public/:id/messages returns only boost messages', async () => {
      const owner = await UserService.findByEmail(ownerEmail);
      expect(owner).not.toBeNull();
      const publicBucket = await BucketService.create({
        ownerId: owner!.id,
        name: `Public Streams Hidden ${Date.now()}`,
        isPublic: true,
      });
      const boostBody = `public-boost-visible-${Date.now()}`;
      const streamBody = `public-stream-hidden-${Date.now()}`;
      await BucketMessageService.create({
        bucketId: publicBucket.id,
        senderName: 'Boost Sender',
        body: boostBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'test-suite',
        isPublic: true,
      });
      await BucketMessageService.create({
        bucketId: publicBucket.id,
        senderName: 'Stream Sender',
        body: streamBody,
        currency: 'USD',
        amount: 1,
        action: 'stream',
        appName: 'test-suite',
        isPublic: true,
      });

      const res = await request(app)
        .get(`${API}/buckets/public/${publicBucket.shortId}/messages`)
        .expect(200);
      const messages = res.body.messages as Array<{ body: string; action?: string }>;
      expect(messages.some((m) => m.body === boostBody)).toBe(true);
      expect(messages.some((m) => m.body === streamBody)).toBe(false);
      expect(messages.some((m) => m.action === 'stream')).toBe(false);
    });
  });
});
