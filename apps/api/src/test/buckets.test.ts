/**
 * API integration tests: buckets CRUD endpoints.
 * Covers list, get, create, update, delete and auth/validation errors.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BucketService, UserService } from '@metaboost/orm';

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
});
