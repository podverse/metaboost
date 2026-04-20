import request from 'supertest';
/**
 * Management API – buckets and messages integration tests.
 * Covers bucket CRUD, message list/get/create/update/delete, and permission gating (bucketsCrud, bucketMessagesCrud).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  BucketAdminService,
  BucketMessageService,
  BucketMessageValue,
  BucketService,
  appDataSourceReadWrite,
} from '@metaboost/orm';

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
  /** rss-channel bucket for message list/get/delete tests (rss-network root excludes own messages from scope). */
  let messagesBucketId: string;
  let messageId: string;
  let streamMessageId: string;

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
      expect(createRes.body.bucket.messageBodyMaxLength).toBe(500);
      expect(createRes.body.bucket.preferredCurrency).toBe('USD');
      expect(createRes.body.bucket.minimumMessageAmountMinor).toBe(0);
      expect(createRes.body.bucket.conversionEndpointUrl).toContain('/v1/buckets/public/');
      bucketId = createRes.body.bucket.id;

      const getRes = await superAdminAgent.get(`${API}/buckets/${bucketId}`).expect(200);
      expect(getRes.body.bucket.id).toBe(bucketId);
      expect(getRes.body.bucket.name).toBe('My Bucket');
      expect(getRes.body.bucket.ownerDisplayName).toBeDefined();
      expect(typeof getRes.body.bucket.ownerDisplayName).toBe('string');
      expect(getRes.body.bucket.preferredCurrency).toBe('USD');
      expect(getRes.body.bucket.minimumMessageAmountMinor).toBe(0);
    });

    it('PATCH /buckets/:id updates bucket', async () => {
      const res = await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ name: 'Updated Bucket', isPublic: false })
        .expect(200);
      expect(res.body.bucket.name).toBe('Updated Bucket');
      expect(res.body.bucket.isPublic).toBe(false);
    });

    it('PATCH /buckets/:id validates messageBodyMaxLength range and disallows null', async () => {
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ messageBodyMaxLength: null })
        .expect(400);
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ messageBodyMaxLength: 139 })
        .expect(400);
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ messageBodyMaxLength: 2501 })
        .expect(400);

      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ messageBodyMaxLength: 140 })
        .expect(200);
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ messageBodyMaxLength: 2500 })
        .expect(200);
    });

    it('PATCH /buckets/:id updates and validates minimumMessageAmountMinor', async () => {
      const setRes = await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ minimumMessageAmountMinor: 155 })
        .expect(200);
      expect(setRes.body.bucket.minimumMessageAmountMinor).toBe(155);

      const getRes = await superAdminAgent.get(`${API}/buckets/${bucketId}`).expect(200);
      expect(getRes.body.bucket.minimumMessageAmountMinor).toBe(155);

      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ minimumMessageAmountMinor: -1 })
        .expect(400);
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ minimumMessageAmountMinor: 2147483648 })
        .expect(400);
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ minimumMessageAmountMinor: null })
        .expect(400);
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ minimumMessageAmountMinor: 1.5 })
        .expect(400);

      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ minimumMessageAmountMinor: 0 })
        .expect(200);
    });

    it('PATCH /buckets/:id updates and validates preferredCurrency for top-level buckets', async () => {
      const setRes = await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ preferredCurrency: 'EUR' })
        .expect(200);
      expect(setRes.body.bucket.preferredCurrency).toBe('EUR');

      const getRes = await superAdminAgent.get(`${API}/buckets/${bucketId}`).expect(200);
      expect(getRes.body.bucket.preferredCurrency).toBe('EUR');

      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ preferredCurrency: 'DOGE' })
        .expect(400);
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ preferredCurrency: null })
        .expect(400);
      await superAdminAgent
        .patch(`${API}/buckets/${bucketId}`)
        .send({ preferredCurrency: '' })
        .expect(400);
    });

    it('GET /buckets/:id returns 404 for nonexistent id', async () => {
      await superAdminAgent
        .get(`${API}/buckets/00000000-0000-0000-0000-000000000000`)
        .expect(404, { message: 'Bucket not found' });
    });

    it('DELETE /buckets/:id returns 401 without auth', async () => {
      await request(app).delete(`${API}/buckets/${bucketId}`).expect(401);
    });

    it('PATCH /buckets/:id allows descendant settings updates and recursive cascade', async () => {
      const parentRes = await superAdminAgent
        .post(`${API}/buckets`)
        .send({
          name: 'Parent Bucket',
          ownerId: ownerUserId,
          isPublic: true,
        })
        .expect(201);
      const parentBucketId = parentRes.body.bucket.id as string;
      await superAdminAgent
        .patch(`${API}/buckets/${parentBucketId}`)
        .send({ messageBodyMaxLength: 150 })
        .expect(200);
      const childBucket = await BucketService.create({
        ownerId: ownerUserId,
        name: 'Child Bucket',
        isPublic: true,
        parentBucketId,
      });
      const grandchildBucket = await BucketService.create({
        ownerId: ownerUserId,
        name: 'Grandchild Bucket',
        isPublic: true,
        parentBucketId: childBucket.id,
      });

      const childUpdate = await superAdminAgent
        .patch(`${API}/buckets/${childBucket.id}`)
        .send({
          isPublic: false,
          messageBodyMaxLength: 222,
          minimumMessageAmountMinor: 333,
          applyToDescendants: true,
        })
        .expect(200);
      expect(childUpdate.body.bucket.isPublic).toBe(false);
      expect(childUpdate.body.bucket.messageBodyMaxLength).toBe(222);
      expect(childUpdate.body.bucket.minimumMessageAmountMinor).toBe(333);

      const updatedGrandchild = await BucketService.findById(grandchildBucket.id);
      expect(updatedGrandchild?.isPublic).toBe(false);
      expect(updatedGrandchild?.settings?.messageBodyMaxLength).toBe(222);
      expect(updatedGrandchild?.settings?.minimumMessageAmountMinor).toBe(333);
    });

    it('PATCH /buckets/:id enforces descendant public guardrail', async () => {
      const parentRes = await superAdminAgent
        .post(`${API}/buckets`)
        .send({
          name: 'Private Parent Bucket',
          ownerId: ownerUserId,
          isPublic: false,
        })
        .expect(201);
      const childBucket = await BucketService.create({
        ownerId: ownerUserId,
        name: 'Private Child Bucket',
        isPublic: false,
        parentBucketId: parentRes.body.bucket.id as string,
      });

      await superAdminAgent
        .patch(`${API}/buckets/${childBucket.id}`)
        .send({ isPublic: true })
        .expect(400, {
          message: 'A descendant bucket can only be public when all ancestor buckets are public.',
        });
      await superAdminAgent
        .patch(`${API}/buckets/${childBucket.id}`)
        .send({ isPublic: false })
        .expect(200);
    });

    it('PATCH /buckets/:id blocks manual rename for rss-channel buckets', async () => {
      const rssChannel = await BucketService.createRssChannel({
        ownerId: ownerUserId,
        name: `management-rss-channel-${Date.now()}`,
        isPublic: true,
      });
      await superAdminAgent
        .patch(`${API}/buckets/${rssChannel.id}`)
        .send({ name: 'manual-rename-attempt' })
        .expect(400, {
          message:
            'Name is derived for RSS channel and item buckets and cannot be edited manually.',
        });
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
      const messagesBucket = await BucketService.createRssChannel({
        ownerId: ownerUserId,
        name: `mgmt-messages-fixture-${Date.now()}`,
        isPublic: true,
      });
      messagesBucketId = messagesBucket.id;
      const seededMessage = await BucketMessageService.create({
        bucketId: messagesBucketId,
        senderName: 'Seed Message',
        body: 'Hello world',
        currency: 'N/A',
        amount: 0,
        action: 'boost',
        appName: 'management-seed',
      });
      messageId = seededMessage.id;
      const seededStreamMessage = await BucketMessageService.create({
        bucketId: messagesBucketId,
        senderName: 'Seed Stream',
        body: null,
        currency: 'USD',
        amount: 1,
        action: 'stream',
        appName: 'management-seed',
      });
      streamMessageId = seededStreamMessage.id;
    });

    it('GET /buckets/:bucketId/messages returns 401 without auth', async () => {
      await request(app).get(`${API}/buckets/${messagesBucketId}/messages`).expect(401);
    });

    it('GET /buckets/:bucketId/messages returns 200 with messages array', async () => {
      const res = await superAdminAgent
        .get(`${API}/buckets/${messagesBucketId}/messages`)
        .expect(200);
      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
      const hasStream = (res.body.messages as Array<{ id: string; action?: string }>).some(
        (message) => message.id === streamMessageId || message.action === 'stream'
      );
      expect(hasStream).toBe(false);
    });

    it('GET /buckets/:bucketId/messages applies root minimum threshold and request maximum logic', async () => {
      const root = await BucketService.createMbRoot({
        ownerId: ownerUserId,
        name: `mgmt-threshold-root-${Date.now()}`,
        isPublic: true,
      });
      const leaf = await BucketService.createMbMid({
        ownerId: ownerUserId,
        parentBucketId: root.id,
        name: `mgmt-threshold-leaf-${Date.now()}`,
        isPublic: true,
      });
      await BucketService.update(root.id, { minimumMessageAmountMinor: 200 });

      const lowBody = `mgmt-threshold-low-${Date.now()}`;
      const highBody = `mgmt-threshold-high-${Date.now()}`;
      const nullBody = `mgmt-threshold-null-${Date.now()}`;

      await BucketMessageService.create({
        bucketId: leaf.id,
        senderName: 'Management Threshold Low',
        body: lowBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
        thresholdCurrencyAtCreate: 'USD',
        thresholdAmountMinorAtCreate: 150,
      });
      await BucketMessageService.create({
        bucketId: leaf.id,
        senderName: 'Management Threshold High',
        body: highBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
        thresholdCurrencyAtCreate: 'USD',
        thresholdAmountMinorAtCreate: 300,
      });
      const nullSnapshotMessage = await BucketMessageService.create({
        bucketId: leaf.id,
        senderName: 'Management Threshold Null',
        body: nullBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
        thresholdCurrencyAtCreate: null,
        thresholdAmountMinorAtCreate: null,
      });

      const nullValue = await appDataSourceReadWrite.getRepository(BucketMessageValue).findOne({
        where: { bucketMessageId: nullSnapshotMessage.id },
      });
      expect(nullValue?.thresholdAmountMinorAtCreate).toBeNull();

      const baselineRes = await superAdminAgent
        .get(`${API}/buckets/${leaf.id}/messages`)
        .expect(200);
      const baselineBodies = (baselineRes.body.messages as Array<{ body: string | null }>).map(
        (message) => message.body
      );
      expect(baselineBodies).toContain(highBody);
      expect(baselineBodies).not.toContain(lowBody);
      expect(baselineBodies).not.toContain(nullBody);
      expect(baselineRes.body.total).toBe(1);
      expect(baselineRes.body.totalPages).toBe(1);

      const tightenedRes = await superAdminAgent
        .get(`${API}/buckets/${leaf.id}/messages?minimumAmountMinor=350`)
        .expect(200);
      expect(tightenedRes.body.messages).toHaveLength(0);
      expect(tightenedRes.body.total).toBe(0);
      expect(tightenedRes.body.totalPages).toBe(0);

      await superAdminAgent
        .get(`${API}/buckets/${leaf.id}/messages?minimumAmountUsdCents=350`)
        .expect(400);
    });

    it('GET /buckets/:bucketId/messages keeps pagination totals coherent with threshold filtering', async () => {
      const root = await BucketService.createMbRoot({
        ownerId: ownerUserId,
        name: `mgmt-threshold-page-root-${Date.now()}`,
        isPublic: true,
      });
      const leaf = await BucketService.createMbMid({
        ownerId: ownerUserId,
        parentBucketId: root.id,
        name: `mgmt-threshold-page-leaf-${Date.now()}`,
        isPublic: true,
      });

      await BucketMessageService.create({
        bucketId: leaf.id,
        senderName: 'Management Threshold Page A',
        body: `mgmt-threshold-page-a-${Date.now()}`,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
        thresholdCurrencyAtCreate: 'USD',
        thresholdAmountMinorAtCreate: 410,
      });
      await BucketMessageService.create({
        bucketId: leaf.id,
        senderName: 'Management Threshold Page B',
        body: `mgmt-threshold-page-b-${Date.now()}`,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
        thresholdCurrencyAtCreate: 'USD',
        thresholdAmountMinorAtCreate: 510,
      });

      const pageRes = await superAdminAgent
        .get(`${API}/buckets/${leaf.id}/messages?minimumAmountMinor=400&limit=1&page=1`)
        .expect(200);
      expect(pageRes.body.messages).toHaveLength(1);
      expect(pageRes.body.total).toBe(2);
      expect(pageRes.body.totalPages).toBe(2);
      expect(pageRes.body.page).toBe(1);
      expect(pageRes.body.limit).toBe(1);
    });

    it('aggregates rss-network messages from descendant channel and item buckets (newest first)', async () => {
      const network = await BucketService.createRssNetwork({
        ownerId: ownerUserId,
        name: `mgmt-network-${Date.now()}`,
        isPublic: true,
      });
      const channel = await BucketService.createRssChannel({
        ownerId: ownerUserId,
        parentBucketId: network.id,
        name: `mgmt-channel-${Date.now()}`,
        isPublic: true,
      });
      const item = await BucketService.createRssItem({
        ownerId: ownerUserId,
        parentBucketId: channel.id,
        name: `mgmt-item-${Date.now()}`,
        isPublic: true,
      });

      const channelBody = `mgmt-network-channel-msg-${Date.now()}`;
      const itemBody = `mgmt-network-item-msg-${Date.now()}`;
      const directNetworkBody = `mgmt-network-direct-msg-${Date.now()}`;

      await BucketMessageService.create({
        bucketId: channel.id,
        senderName: 'Management Channel Sender',
        body: channelBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
      });
      await new Promise((resolve) => setTimeout(resolve, 15));
      await BucketMessageService.create({
        bucketId: item.id,
        senderName: 'Management Item Sender',
        body: itemBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
      });
      await new Promise((resolve) => setTimeout(resolve, 15));
      await BucketMessageService.create({
        bucketId: network.id,
        senderName: 'Management Direct Network Sender',
        body: directNetworkBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
      });

      const networkRecentRes = await superAdminAgent
        .get(`${API}/buckets/${network.id}/messages`)
        .expect(200);
      const networkRecentBodies = (networkRecentRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(networkRecentBodies).toEqual([itemBody, channelBody]);
      expect(networkRecentBodies).not.toContain(directNetworkBody);

      const networkOldestRes = await superAdminAgent
        .get(`${API}/buckets/${network.id}/messages?sort=oldest`)
        .expect(200);
      const networkOldestBodies = (networkOldestRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(networkOldestBodies).toEqual([channelBody, itemBody]);

      const channelRes = await superAdminAgent
        .get(`${API}/buckets/${channel.id}/messages`)
        .expect(200);
      const channelBodies = (channelRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(channelBodies).toEqual([itemBody, channelBody]);

      const channelOldestRes = await superAdminAgent
        .get(`${API}/buckets/${channel.id}/messages?sort=oldest`)
        .expect(200);
      const channelOldestBodies = (channelOldestRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(channelOldestBodies).toEqual([channelBody, itemBody]);

      const itemRes = await superAdminAgent.get(`${API}/buckets/${item.id}/messages`).expect(200);
      const itemBodies = (itemRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(itemBodies).toContain(itemBody);
      expect(itemBodies).not.toContain(channelBody);
    });

    it('keeps mb-root, mb-mid, and mb-leaf message scopes isolated to their own bucket id', async () => {
      const mbRoot = await BucketService.createMbRoot({
        ownerId: ownerUserId,
        name: `mgmt-mb-root-${Date.now()}`,
        isPublic: true,
      });
      const mbMid = await BucketService.createMbMid({
        ownerId: ownerUserId,
        parentBucketId: mbRoot.id,
        name: `mgmt-mb-mid-${Date.now()}`,
        isPublic: true,
      });
      const mbLeaf = await BucketService.createMbLeaf({
        ownerId: ownerUserId,
        parentBucketId: mbMid.id,
        name: `mgmt-mb-leaf-${Date.now()}`,
        isPublic: true,
      });

      const rootBody = `mgmt-mb-root-msg-${Date.now()}`;
      const midBody = `mgmt-mb-mid-msg-${Date.now()}`;
      const leafBody = `mgmt-mb-leaf-msg-${Date.now()}`;

      await BucketMessageService.create({
        bucketId: mbRoot.id,
        senderName: 'Management MB Root Sender',
        body: rootBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
      });
      await BucketMessageService.create({
        bucketId: mbMid.id,
        senderName: 'Management MB Mid Sender',
        body: midBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
      });
      await BucketMessageService.create({
        bucketId: mbLeaf.id,
        senderName: 'Management MB Leaf Sender',
        body: leafBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'management-seed',
      });

      const rootRes = await superAdminAgent.get(`${API}/buckets/${mbRoot.id}/messages`).expect(200);
      const rootBodies = (rootRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(rootBodies).toContain(rootBody);
      expect(rootBodies).not.toContain(midBody);
      expect(rootBodies).not.toContain(leafBody);

      const midRes = await superAdminAgent.get(`${API}/buckets/${mbMid.id}/messages`).expect(200);
      const midBodies = (midRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(midBodies).toContain(midBody);
      expect(midBodies).not.toContain(rootBody);
      expect(midBodies).not.toContain(leafBody);

      const leafRes = await superAdminAgent.get(`${API}/buckets/${mbLeaf.id}/messages`).expect(200);
      const leafBodies = (leafRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(leafBodies).toContain(leafBody);
      expect(leafBodies).not.toContain(rootBody);
      expect(leafBodies).not.toContain(midBody);
    });

    it('GET /buckets/:bucketId/messages/:messageId returns message', async () => {
      const res = await superAdminAgent
        .get(`${API}/buckets/${messagesBucketId}/messages/${messageId}`)
        .expect(200);
      expect(res.body.message.id).toBe(messageId);
      expect(res.body.message.body).toBe('Hello world');
    });

    it('GET /buckets/:bucketId/messages/:messageId returns 404 for stream message', async () => {
      await superAdminAgent
        .get(`${API}/buckets/${messagesBucketId}/messages/${streamMessageId}`)
        .expect(404, { message: 'Message not found' });
    });

    it('POST /buckets/:bucketId/messages returns 404 (route removed)', async () => {
      await superAdminAgent
        .post(`${API}/buckets/${messagesBucketId}/messages`)
        .send({ senderName: 'Test Sender', body: 'Should not be accepted' })
        .expect(404);
    });

    it('PATCH /buckets/:bucketId/messages/:messageId returns 404 (route removed)', async () => {
      await superAdminAgent
        .patch(`${API}/buckets/${messagesBucketId}/messages/${messageId}`)
        .send({ body: 'Should not be accepted' })
        .expect(404);
    });

    it('DELETE /buckets/:bucketId/messages/:messageId deletes message', async () => {
      await superAdminAgent
        .delete(`${API}/buckets/${messagesBucketId}/messages/${messageId}`)
        .expect(204);
      await superAdminAgent
        .get(`${API}/buckets/${messagesBucketId}/messages/${messageId}`)
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
