/**
 * API integration tests: bucket roles CRUD endpoints.
 * Covers list (predefined + custom), create, update, delete and auth/validation errors.
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
const FILE_PREFIX = 'bucket-roles';

describe('bucket roles', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password-1`;
  let rootBucketIdText: string;

  beforeAll(async () => {
    app = await createApiTestApp();
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'Bucket Roles Owner',
    });
    const root = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: `${FILE_PREFIX}-root`,
      isPublic: true,
    });
    rootBucketIdText = root.idText;
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
  });

  describe('GET /buckets/:bucketId/roles', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).get(`${API}/buckets/${rootBucketIdText}/roles`).expect(401);
    });

    it('returns 200 with roles array including predefined roles when authenticated', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent.get(`${API}/buckets/${rootBucketIdText}/roles`).expect(200);
      expect(Array.isArray(res.body.roles)).toBe(true);
      const predefined = res.body.roles.filter(
        (r: { isPredefined: boolean }) => r.isPredefined === true
      );
      expect(predefined.length).toBeGreaterThanOrEqual(2);
      const ids = predefined.map((r: { id: string }) => r.id);
      expect(ids).toContain('everything');
      expect(ids).toContain('read_everything');
      for (const role of predefined) {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('nameKey');
        expect(role).toHaveProperty('bucketCrud');
        expect(role).toHaveProperty('bucketMessagesCrud');
        expect(role).toHaveProperty('bucketAdminsCrud');
        expect(role).toHaveProperty('isPredefined', true);
        expect(role.createdAt).toBeNull();
      }
    });

    it('returns 404 for nonexistent bucket', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent.get(`${API}/buckets/nonexistent-short-id/roles`).expect(404);
    });
  });

  describe('POST /buckets/:bucketId/roles', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app)
        .post(`${API}/buckets/${rootBucketIdText}/roles`)
        .send({ name: 'Test', bucketCrud: 0, bucketMessagesCrud: 0, bucketAdminsCrud: 0 })
        .expect(401);
    });

    it('returns 400 when name is missing', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent
        .post(`${API}/buckets/${rootBucketIdText}/roles`)
        .send({ bucketCrud: 0, bucketMessagesCrud: 0, bucketAdminsCrud: 0 })
        .expect(400);
      expect(res.body.message).toBe('Validation failed');
    });

    it('returns 400 when bucketCrud is outside 0-15', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${rootBucketIdText}/roles`)
        .send({ name: 'Invalid Crud', bucketCrud: -1, bucketMessagesCrud: 0, bucketAdminsCrud: 0 })
        .expect(400);
      await agent
        .post(`${API}/buckets/${rootBucketIdText}/roles`)
        .send({ name: 'Invalid Crud', bucketCrud: 16, bucketMessagesCrud: 0, bucketAdminsCrud: 0 })
        .expect(400);
    });

    it('returns 400 when required crud fields are missing', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${rootBucketIdText}/roles`)
        .send({ name: 'Missing Crud Fields' })
        .expect(400);
    });

    it('returns 201 with created custom role when body valid', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const roleName = `${FILE_PREFIX}-custom-${Date.now()}`;
      const res = await agent
        .post(`${API}/buckets/${rootBucketIdText}/roles`)
        .send({ name: roleName, bucketCrud: 3, bucketMessagesCrud: 2, bucketAdminsCrud: 0 })
        .expect(201);
      expect(res.body.role).toBeDefined();
      expect(res.body.role.name).toBe(roleName);
      expect(res.body.role.bucketCrud).toBe(3);
      // normalizeBucketMessageCrud ORs bucketMessagesCrud with READ_BIT | bucketCrud
      // input: bucketCrud=3, bucketMessagesCrud=2 → output: 2 | 1 | 3 = 3
      expect(res.body.role.bucketMessagesCrud).toBe(3);
      expect(res.body.role.bucketAdminsCrud).toBe(0);
      expect(res.body.role.isPredefined).toBe(false);
      expect(res.body.role.createdAt).toBeTypeOf('string');
      expect(res.body.role).toHaveProperty('id');
    });

    it('returns 400 when creating role on non-root bucket (requireRoot enforced)', async () => {
      const rootBucket = await BucketService.findByIdText(rootBucketIdText);
      expect(rootBucket).not.toBeNull();
      // Create a mid bucket owned by the same root owner so they pass the permission check,
      // then confirm the requireRoot guard returns 400 for the descendant.
      const mid = await BucketService.createMbMid({
        ownerId: rootBucket!.ownerId,
        parentBucketId: rootBucket!.id,
        name: `${FILE_PREFIX}-mid-${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent
        .post(`${API}/buckets/${mid.idText}/roles`)
        .send({ name: 'Should Fail', bucketCrud: 0, bucketMessagesCrud: 0, bucketAdminsCrud: 0 })
        .expect(400);
      expect(res.body.message).toContain('root bucket');
    });
  });

  describe('PATCH /buckets/:bucketId/roles/:roleId', () => {
    it('returns 404 for nonexistent roleId', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .patch(`${API}/buckets/${rootBucketIdText}/roles/00000000-0000-4000-a000-000000000000`)
        .send({ name: 'Nope' })
        .expect(404, { message: 'Role not found' });
    });

    it('returns 200 with updated role when body valid', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const roleName = `${FILE_PREFIX}-to-update-${Date.now()}`;
      const created = await agent
        .post(`${API}/buckets/${rootBucketIdText}/roles`)
        .send({ name: roleName, bucketCrud: 1, bucketMessagesCrud: 1, bucketAdminsCrud: 1 })
        .expect(201);
      const roleId = created.body.role.id;
      const updatedName = `${FILE_PREFIX}-updated-${Date.now()}`;
      const res = await agent
        .patch(`${API}/buckets/${rootBucketIdText}/roles/${roleId}`)
        .send({ name: updatedName, bucketCrud: 15 })
        .expect(200);
      expect(res.body.role.name).toBe(updatedName);
      expect(res.body.role.bucketCrud).toBe(15);
    });
  });

  describe('DELETE /buckets/:bucketId/roles/:roleId', () => {
    it('returns 404 for nonexistent roleId', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .delete(`${API}/buckets/${rootBucketIdText}/roles/00000000-0000-4000-a000-000000000000`)
        .expect(404, { message: 'Role not found' });
    });

    it('returns 204 when role exists and is deleted', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const roleName = `${FILE_PREFIX}-to-delete-${Date.now()}`;
      const created = await agent
        .post(`${API}/buckets/${rootBucketIdText}/roles`)
        .send({ name: roleName, bucketCrud: 0, bucketMessagesCrud: 0, bucketAdminsCrud: 0 })
        .expect(201);
      const roleId = created.body.role.id;

      await agent.delete(`${API}/buckets/${rootBucketIdText}/roles/${roleId}`).expect(204);
    });

    it('role no longer appears in list after delete', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const roleName = `${FILE_PREFIX}-vanish-${Date.now()}`;
      const created = await agent
        .post(`${API}/buckets/${rootBucketIdText}/roles`)
        .send({ name: roleName, bucketCrud: 0, bucketMessagesCrud: 0, bucketAdminsCrud: 0 })
        .expect(201);
      const roleId = created.body.role.id;

      await agent.delete(`${API}/buckets/${rootBucketIdText}/roles/${roleId}`).expect(204);

      const listRes = await agent.get(`${API}/buckets/${rootBucketIdText}/roles`).expect(200);
      const customRoles = listRes.body.roles.filter(
        (r: { isPredefined: boolean }) => r.isPredefined === false
      );
      const found = customRoles.find((r: { id: string }) => r.id === roleId);
      expect(found).toBeUndefined();
    });
  });
});
