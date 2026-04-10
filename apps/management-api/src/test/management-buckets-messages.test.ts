import request from 'supertest';
/**
 * Management API – buckets and messages integration tests.
 * Covers bucket CRUD, message list/get/create/update/delete, and permission gating (bucketsCrud, bucketMessagesCrud).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BucketAdminService, BucketService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import { retryTransientNetwork } from './helpers/retry-transient-network.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'mgmt-buckets';
const superAdminUsername = `${FILE_PREFIX}-super-admin`;
const superAdminPassword = `${FILE_PREFIX}-super-admin-password-1`;

describe('management-api buckets and messages', () => {
  let app: Awaited<ReturnType<typeof createManagementApiTestAppWithSuperAdmin>>;
  let superAdminAgent: ReturnType<typeof request.agent>;
  let ownerUserId: string;
  let bucketId: string;
  let messageId: string;

  beforeAll(async () => {
    app = await createManagementApiTestAppWithSuperAdmin(superAdminUsername, superAdminPassword);
    superAdminAgent = await retryTransientNetwork('create super admin login agent', async () =>
      createManagementLoginAgent(app, {
        username: superAdminUsername,
        password: superAdminPassword,
      })
    );

    const userRes = await retryTransientNetwork('create seed bucket owner user', async () =>
      superAdminAgent
        .post(`${API}/users`)
        .send({
          email: `${FILE_PREFIX}-owner@example.com`,
          password: `${FILE_PREFIX}-owner-password-1`,
          displayName: 'Bucket Owner',
        })
        .expect(201)
    );
    ownerUserId = userRes.body.user.id;
  });

  afterAll(async () => {
    await destroyManagementApiTestDataSources();
  });

  describe('buckets', () => {
    it('GET /buckets returns 401 without auth', async () => {
      await request(app).get(`${API}/buckets`).expect(401);
    });

    it('GET /buckets returns 200 with buckets array (super admin)', async () => {
      const res = await superAdminAgent.get(`${API}/buckets`).expect(200);
      expect(res.body).toHaveProperty('buckets');
      expect(Array.isArray(res.body.buckets)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('totalPages');
    });

    it('POST /buckets returns 400 when ownerId is not a valid user', async () => {
      await superAdminAgent
        .post(`${API}/buckets`)
        .send({
          name: 'Test Bucket',
          ownerId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(400, { message: 'Owner not found' });
    });

    it('POST /buckets creates bucket and GET /buckets/:id returns it with ownerDisplayName', async () => {
      const createRes = await superAdminAgent
        .post(`${API}/buckets`)
        .send({
          name: 'My Bucket',
          ownerId: ownerUserId,
          isPublic: true,
        })
        .expect(201);
      expect(createRes.body.bucket).toHaveProperty('id');
      expect(createRes.body.bucket.name).toBe('My Bucket');
      expect(createRes.body.bucket.ownerId).toBe(ownerUserId);
      bucketId = createRes.body.bucket.id;

      const getRes = await superAdminAgent.get(`${API}/buckets/${bucketId}`).expect(200);
      expect(getRes.body.bucket.id).toBe(bucketId);
      expect(getRes.body.bucket.name).toBe('My Bucket');
      expect(getRes.body.bucket.ownerDisplayName).toBeDefined();
      expect(typeof getRes.body.bucket.ownerDisplayName).toBe('string');
    });

    it('PATCH /buckets/:id updates bucket', async () => {
      const res = await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ name: 'Updated Bucket', isPublic: false })
        .expect(200);
      expect(res.body.bucket.name).toBe('Updated Bucket');
      expect(res.body.bucket.isPublic).toBe(false);
    });

    it('GET /buckets/:id returns 404 for nonexistent id', async () => {
      await superAdminAgent
        .get(`${API}/buckets/00000000-0000-0000-0000-000000000000`)
        .expect(404, { message: 'Bucket not found' });
    });

    it('DELETE /buckets/:id returns 401 without auth', async () => {
      await request(app).delete(`${API}/buckets/${bucketId}`).expect(401);
    });

    it('PATCH /buckets/:id allows name-only updates for descendant buckets', async () => {
      const parentRes = await superAdminAgent
        .post(`${API}/buckets`)
        .send({
          name: 'Parent Bucket',
          ownerId: ownerUserId,
          isPublic: true,
        })
        .expect(201);
      const parentBucketId = parentRes.body.bucket.id as string;
      const childBucket = await BucketService.create({
        ownerId: ownerUserId,
        name: 'Child Bucket',
        isPublic: true,
        parentBucketId,
      });

      await superAdminAgent
        .patch(`${API}/buckets/${childBucket.id}`)
        .send({ isPublic: false })
        .expect(400, {
          message:
            'Descendant buckets inherit settings from the root bucket; only name can be updated.',
        });

      const renameRes = await superAdminAgent
        .patch(`${API}/buckets/${childBucket.id}`)
        .send({ name: 'Child Bucket Renamed' })
        .expect(200);
      expect(renameRes.body.bucket.name).toBe('Child Bucket Renamed');
    });
  });

  describe('bucket roles', () => {
    it('GET /buckets/:id/roles returns 401 without auth', async () => {
      await request(app).get(`${API}/buckets/${bucketId}/roles`).expect(401);
    });

    it('GET /buckets/:id/roles returns 200 with predefined and custom roles', async () => {
      const res = await superAdminAgent.get(`${API}/buckets/${bucketId}/roles`).expect(200);
      expect(res.body).toHaveProperty('roles');
      expect(Array.isArray(res.body.roles)).toBe(true);
      const predefined = res.body.roles.filter((r: { isPredefined: boolean }) => r.isPredefined);
      expect(predefined.length).toBeGreaterThanOrEqual(4);
      expect(predefined.map((r: { id: string }) => r.id).sort()).toContain('everything');
      expect(predefined.map((r: { id: string }) => r.id).sort()).toContain('bucket_read');
    });

    it('GET /buckets/:id/roles returns 404 for nonexistent bucket', async () => {
      await superAdminAgent
        .get(`${API}/buckets/00000000-0000-0000-0000-000000000000/roles`)
        .expect(404, { message: 'Bucket not found' });
    });

    it('POST /buckets/:id/roles creates custom role', async () => {
      const createRes = await superAdminAgent
        .post(`${API}/buckets/${bucketId}/roles`)
        .send({
          name: 'Custom Role A',
          bucketCrud: 7,
          bucketMessagesCrud: 7,
          bucketAdminsCrud: 7,
        })
        .expect(201);
      expect(createRes.body.role).toHaveProperty('id');
      expect(createRes.body.role.name).toBe('Custom Role A');
      expect(createRes.body.role.isPredefined).toBe(false);
      expect(createRes.body.role.bucketCrud).toBe(7);
      expect(createRes.body.role.bucketMessagesCrud).toBe(7);

      const listRes = await superAdminAgent.get(`${API}/buckets/${bucketId}/roles`).expect(200);
      const custom = listRes.body.roles.filter((r: { isPredefined: boolean }) => !r.isPredefined);
      expect(custom.some((r: { name: string }) => r.name === 'Custom Role A')).toBe(true);
    });

    it('PATCH /buckets/:id/roles/:roleId updates custom role', async () => {
      const listRes = await superAdminAgent.get(`${API}/buckets/${bucketId}/roles`).expect(200);
      const custom = listRes.body.roles.find(
        (r: { isPredefined: boolean; name: string }) =>
          !r.isPredefined && r.name === 'Custom Role A'
      );
      expect(custom).toBeDefined();
      const roleId = custom.id;

      const res = await superAdminAgent
        .patch(`${API}/buckets/${bucketId}/roles/${roleId}`)
        .send({ name: 'Custom Role A Updated', bucketCrud: 15 })
        .expect(200);
      expect(res.body.role.name).toBe('Custom Role A Updated');
      expect(res.body.role.bucketCrud).toBe(15);
    });

    it('PATCH /buckets/:id/roles/:roleId returns 404 for wrong role id', async () => {
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}/roles/00000000-0000-0000-0000-000000000000`)
        .send({ name: 'X' })
        .expect(404, { message: 'Role not found' });
    });

    it('POST /buckets/:id/roles validates name and crud 0-15', async () => {
      await superAdminAgent
        .post(`${API}/buckets/${bucketId}/roles`)
        .send({
          name: '',
          bucketCrud: 0,
          bucketMessagesCrud: 0,
          bucketAdminsCrud: 0,
        })
        .expect(400);

      await superAdminAgent
        .post(`${API}/buckets/${bucketId}/roles`)
        .send({
          name: 'Bad Crud',
          bucketCrud: 16,
          bucketMessagesCrud: 0,
          bucketAdminsCrud: 0,
        })
        .expect(400);
    });

    it('DELETE /buckets/:id/roles/:roleId deletes custom role', async () => {
      const listRes = await superAdminAgent.get(`${API}/buckets/${bucketId}/roles`).expect(200);
      const custom = listRes.body.roles.find(
        (r: { isPredefined: boolean; name: string }) =>
          !r.isPredefined && r.name === 'Custom Role A Updated'
      );
      expect(custom).toBeDefined();
      const roleId = custom.id;

      await superAdminAgent.delete(`${API}/buckets/${bucketId}/roles/${roleId}`).expect(204);
      const afterRes = await superAdminAgent.get(`${API}/buckets/${bucketId}/roles`).expect(200);
      expect(afterRes.body.roles.some((r: { id: string }) => r.id === roleId)).toBe(false);
    });
  });

  describe('bucket messages', () => {
    beforeAll(async () => {
      if (bucketId === undefined) {
        const createRes = await superAdminAgent
          .post(`${API}/buckets`)
          .send({ name: 'Messages Bucket', ownerId: ownerUserId })
          .expect(201);
        bucketId = createRes.body.bucket.id;
      }
    });

    it('GET /buckets/:bucketId/messages returns 401 without auth', async () => {
      await request(app).get(`${API}/buckets/${bucketId}/messages`).expect(401);
    });

    it('GET /buckets/:bucketId/messages returns 200 with messages array', async () => {
      const res = await superAdminAgent.get(`${API}/buckets/${bucketId}/messages`).expect(200);
      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('POST /buckets/:bucketId/messages creates message', async () => {
      const createRes = await superAdminAgent
        .post(`${API}/buckets/${bucketId}/messages`)
        .send({ senderName: 'Test Sender', body: 'Hello world', isPublic: true })
        .expect(201);
      expect(createRes.body.message).toHaveProperty('id');
      expect(createRes.body.message.bucketId).toBe(bucketId);
      expect(createRes.body.message.senderName).toBe('Test Sender');
      expect(createRes.body.message.body).toBe('Hello world');
      messageId = createRes.body.message.id;
    });

    it('GET /buckets/:bucketId/messages/:messageId returns message', async () => {
      const res = await superAdminAgent
        .get(`${API}/buckets/${bucketId}/messages/${messageId}`)
        .expect(200);
      expect(res.body.message.id).toBe(messageId);
      expect(res.body.message.body).toBe('Hello world');
    });

    it('PATCH /buckets/:bucketId/messages/:messageId updates message', async () => {
      const res = await superAdminAgent
        .patch(`${API}/buckets/${bucketId}/messages/${messageId}`)
        .send({ body: 'Updated body', isPublic: false })
        .expect(200);
      expect(res.body.message.body).toBe('Updated body');
      expect(res.body.message.isPublic).toBe(false);
    });

    it('DELETE /buckets/:bucketId/messages/:messageId deletes message', async () => {
      await superAdminAgent.delete(`${API}/buckets/${bucketId}/messages/${messageId}`).expect(204);
      await superAdminAgent
        .get(`${API}/buckets/${bucketId}/messages/${messageId}`)
        .expect(404, { message: 'Message not found' });
    });
  });

  describe('bucketsCrud permission', () => {
    const ts = Date.now();
    const noBucketsEmail = `no-buckets-${ts}@example.com`;
    const noBucketsPassword = 'no-buckets-password-1';
    let noBucketsAgent: ReturnType<typeof request.agent>;
    let testBucketId: string;

    beforeAll(async () => {
      await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: noBucketsEmail,
          password: noBucketsPassword,
          displayName: `No Buckets Admin ${ts}`,
          adminsCrud: 0,
          usersCrud: 0,
          bucketsCrud: 0,
          bucketMessagesCrud: 0,
          bucketAdminsCrud: 0,
          eventVisibility: 'own',
        })
        .expect(201);

      noBucketsAgent = await createManagementLoginAgent(app, {
        username: noBucketsEmail,
        password: noBucketsPassword,
      });

      const bucketRes = await superAdminAgent
        .post(`${API}/buckets`)
        .send({ name: 'Perm Test Bucket', ownerId: ownerUserId })
        .expect(201);
      testBucketId = bucketRes.body.bucket.id;
    });

    it('GET /buckets returns 403 when bucketsCrud read is 0', async () => {
      await noBucketsAgent
        .get(`${API}/buckets`)
        .expect(403, { message: 'Insufficient permissions' });
    });

    it('GET /buckets/:id returns 403 when bucketsCrud read is 0', async () => {
      await noBucketsAgent
        .get(`${API}/buckets/${testBucketId}`)
        .expect(403, { message: 'Insufficient permissions' });
    });

    it('GET /buckets/:bucketId/messages returns 403 when bucketsCrud read is 0', async () => {
      await noBucketsAgent
        .get(`${API}/buckets/${testBucketId}/messages`)
        .expect(403, { message: 'Insufficient permissions' });
    });
  });

  describe('bucketMessagesCrud permission', () => {
    const ts = Date.now();
    const bucketsReadOnlyEmail = `buckets-read-${ts}@example.com`;
    const bucketsReadOnlyPassword = 'buckets-read-password-1';
    let bucketsReadOnlyAgent: ReturnType<typeof request.agent>;
    let testBucketId: string;

    beforeAll(async () => {
      await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: bucketsReadOnlyEmail,
          password: bucketsReadOnlyPassword,
          displayName: `Buckets Read Only ${ts}`,
          adminsCrud: 0,
          usersCrud: 0,
          bucketsCrud: 2,
          bucketMessagesCrud: 0,
          bucketAdminsCrud: 0,
          eventVisibility: 'own',
        })
        .expect(201);

      bucketsReadOnlyAgent = await createManagementLoginAgent(app, {
        username: bucketsReadOnlyEmail,
        password: bucketsReadOnlyPassword,
      });

      const bucketRes = await superAdminAgent
        .post(`${API}/buckets`)
        .send({ name: 'Messages Perm Bucket', ownerId: ownerUserId })
        .expect(201);
      testBucketId = bucketRes.body.bucket.id;
    });

    it('GET /buckets returns 200 when bucketsCrud read is set', async () => {
      const res = await bucketsReadOnlyAgent.get(`${API}/buckets`).expect(200);
      expect(Array.isArray(res.body.buckets)).toBe(true);
    });

    it('GET /buckets/:id returns 200 when bucketsCrud read is set', async () => {
      await bucketsReadOnlyAgent.get(`${API}/buckets/${testBucketId}`).expect(200);
    });

    it('GET /buckets/:bucketId/messages returns 403 when bucketMessagesCrud read is 0', async () => {
      await bucketsReadOnlyAgent
        .get(`${API}/buckets/${testBucketId}/messages`)
        .expect(403, { message: 'Insufficient permissions' });
    });
  });

  describe('bucketAdminsCrud permission', () => {
    const ts = Date.now();
    const noBucketAdminsEmail = `no-bucket-admins-${ts}@example.com`;
    const noBucketAdminsPassword = 'no-bucket-admins-password-1';
    const withBucketAdminsEmail = `with-bucket-admins-${ts}@example.com`;
    const withBucketAdminsPassword = 'with-bucket-admins-password-1';
    let noBucketAdminsAgent: ReturnType<typeof request.agent>;
    let withBucketAdminsAgent: ReturnType<typeof request.agent>;
    let testBucketId: string;
    let invitationId: string;
    let adminUserId: string;

    beforeAll(async () => {
      await retryTransientNetwork('create no-bucket-admins management admin', async () =>
        superAdminAgent
          .post(`${API}/admins`)
          .send({
            username: noBucketAdminsEmail,
            password: noBucketAdminsPassword,
            displayName: `No Bucket Admins ${ts}`,
            adminsCrud: 0,
            usersCrud: 0,
            bucketsCrud: 2,
            bucketMessagesCrud: 0,
            bucketAdminsCrud: 0,
            eventVisibility: 'own',
          })
          .expect(201)
      );

      await retryTransientNetwork('create with-bucket-admins management admin', async () =>
        superAdminAgent
          .post(`${API}/admins`)
          .send({
            username: withBucketAdminsEmail,
            password: withBucketAdminsPassword,
            displayName: `With Bucket Admins ${ts}`,
            adminsCrud: 0,
            usersCrud: 0,
            bucketsCrud: 2,
            bucketMessagesCrud: 0,
            bucketAdminsCrud: 15,
            eventVisibility: 'own',
          })
          .expect(201)
      );

      noBucketAdminsAgent = await retryTransientNetwork(
        'login no-bucket-admins management admin',
        async () =>
          createManagementLoginAgent(app, {
            username: noBucketAdminsEmail,
            password: noBucketAdminsPassword,
          })
      );

      withBucketAdminsAgent = await retryTransientNetwork(
        'login with-bucket-admins management admin',
        async () =>
          createManagementLoginAgent(app, {
            username: withBucketAdminsEmail,
            password: withBucketAdminsPassword,
          })
      );

      const bucketRes = await retryTransientNetwork(
        'create bucket-admins permission test bucket',
        async () =>
          superAdminAgent
            .post(`${API}/buckets`)
            .send({ name: 'Bucket Admins Perm Bucket', ownerId: ownerUserId })
            .expect(201)
      );
      testBucketId = bucketRes.body.bucket.id;

      const adminUserRes = await retryTransientNetwork(
        'create bucket-admin-member user',
        async () =>
          superAdminAgent
            .post(`${API}/users`)
            .send({
              email: `bucket-admin-member-${ts}@example.com`,
              password: 'admin-member-password-1',
              displayName: 'Bucket Admin Member',
            })
            .expect(201)
      );
      adminUserId = adminUserRes.body.user.id;
      await BucketAdminService.create({
        bucketId: testBucketId,
        userId: adminUserId,
        bucketCrud: 0,
        bucketMessagesCrud: 2,
        bucketAdminsCrud: 2,
      });
    });

    it('GET /buckets/:id/admins returns 403 when bucketAdminsCrud read is 0', async () => {
      await noBucketAdminsAgent
        .get(`${API}/buckets/${testBucketId}/admins`)
        .expect(403, { message: 'Insufficient permissions' });
    });

    it('GET /buckets/:id/admin-invitations returns 403 when bucketAdminsCrud read is 0', async () => {
      await noBucketAdminsAgent
        .get(`${API}/buckets/${testBucketId}/admin-invitations`)
        .expect(403, { message: 'Insufficient permissions' });
    });

    it('POST /buckets/:id/admin-invitations returns 403 when bucketAdminsCrud create is 0', async () => {
      await noBucketAdminsAgent
        .post(`${API}/buckets/${testBucketId}/admin-invitations`)
        .send({ bucketCrud: 0, bucketMessagesCrud: 0, bucketAdminsCrud: 2 })
        .expect(403, { message: 'Insufficient permissions' });
    });

    it('GET /buckets/:id/admins returns 200 when bucketAdminsCrud read is set', async () => {
      const res = await withBucketAdminsAgent
        .get(`${API}/buckets/${testBucketId}/admins`)
        .expect(200);
      expect(res.body).toHaveProperty('admins');
      expect(Array.isArray(res.body.admins)).toBe(true);
    });

    it('GET /buckets/:id/admin-invitations returns 200 when bucketAdminsCrud read is set', async () => {
      const res = await withBucketAdminsAgent
        .get(`${API}/buckets/${testBucketId}/admin-invitations`)
        .expect(200);
      expect(res.body).toHaveProperty('invitations');
      expect(Array.isArray(res.body.invitations)).toBe(true);
    });

    it('POST /buckets/:id/admin-invitations creates invitation when bucketAdminsCrud create is set', async () => {
      const res = await withBucketAdminsAgent
        .post(`${API}/buckets/${testBucketId}/admin-invitations`)
        .send({ bucketCrud: 0, bucketMessagesCrud: 2, bucketAdminsCrud: 2 })
        .expect(201);
      expect(res.body.invitation).toHaveProperty('id');
      expect(res.body.invitation).toHaveProperty('token');
      expect(res.body.invitation.bucketCrud).toBe(2);
      expect(res.body.invitation.bucketMessagesCrud).toBe(2);
      invitationId = res.body.invitation.id;
    });

    it('DELETE /buckets/:id/admin-invitations/:invitationId returns 204 when bucketAdminsCrud delete is set', async () => {
      await withBucketAdminsAgent
        .delete(`${API}/buckets/${testBucketId}/admin-invitations/${invitationId}`)
        .expect(204);
    });

    it('GET /buckets/:id/admins/:userId returns 200 when bucketAdminsCrud read is set', async () => {
      const res = await withBucketAdminsAgent
        .get(`${API}/buckets/${testBucketId}/admins/${adminUserId}`)
        .expect(200);
      expect(res.body.admin).toHaveProperty('userId', adminUserId);
      expect(res.body.admin.bucketMessagesCrud).toBe(2);
    });

    it('PATCH /buckets/:id/admins/:userId returns 200 when bucketAdminsCrud update is set', async () => {
      await withBucketAdminsAgent
        .patch(`${API}/buckets/${testBucketId}/admins/${adminUserId}`)
        .send({ bucketMessagesCrud: 4 })
        .expect(200);
      const res = await withBucketAdminsAgent
        .get(`${API}/buckets/${testBucketId}/admins/${adminUserId}`)
        .expect(200);
      expect(res.body.admin.bucketMessagesCrud).toBe(6);
    });

    it('GET /buckets/:id/admins/:userId returns 403 when bucketAdminsCrud read is 0', async () => {
      await noBucketAdminsAgent
        .get(`${API}/buckets/${testBucketId}/admins/${adminUserId}`)
        .expect(403, { message: 'Insufficient permissions' });
    });

    it('PATCH /buckets/:id/admins/:userId returns 403 when bucketAdminsCrud update is 0', async () => {
      await noBucketAdminsAgent
        .patch(`${API}/buckets/${testBucketId}/admins/${adminUserId}`)
        .send({ bucketMessagesCrud: 4 })
        .expect(403, { message: 'Insufficient permissions' });
    });

    it('DELETE /buckets/:id/admins/:userId returns 403 when bucketAdminsCrud delete is 0', async () => {
      await noBucketAdminsAgent
        .delete(`${API}/buckets/${testBucketId}/admins/${adminUserId}`)
        .expect(403, { message: 'Insufficient permissions' });
    });

    it('DELETE /buckets/:id/admins/:userId returns 204 when bucketAdminsCrud delete is set', async () => {
      await withBucketAdminsAgent
        .delete(`${API}/buckets/${testBucketId}/admins/${adminUserId}`)
        .expect(204);
      const listRes = await withBucketAdminsAgent
        .get(`${API}/buckets/${testBucketId}/admins`)
        .expect(200);
      const found = listRes.body.admins.some((a: { userId: string }) => a.userId === adminUserId);
      expect(found).toBe(false);
    });
  });
});
