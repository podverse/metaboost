/**
 * API integration tests: buckets CRUD endpoints.
 * Covers list, get, create, update, delete and auth/validation errors.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BucketMessageService, BucketService, UserService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'buckets';

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
      await agent.post(`${API}/buckets`).send({}).expect(400);
    });

    it('returns 201 with bucket when authenticated and body valid', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent
        .post(`${API}/buckets`)
        .send({ name: `${FILE_PREFIX}-new-${Date.now()}` })
        .expect(201);
      expect(res.body.bucket).toBeDefined();
      expect(res.body.bucket).toHaveProperty('id');
      expect(res.body.bucket).toHaveProperty('shortId');
      expect(res.body.bucket).toHaveProperty('name');
      expect(res.body.bucket).toHaveProperty('ownerId');
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
