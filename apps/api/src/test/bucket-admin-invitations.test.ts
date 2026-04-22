/**
 * API integration tests: user-facing bucket admin invitation endpoints.
 * Covers GET by token (public), accept (authenticated), and reject (authenticated).
 * Bucket-scoped invitation CRUD (create/list/delete) is tested via bucket-admins.test.ts
 * and management-api bucketAdminsCrud permission tests.
 */
import { randomBytes } from 'crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  BucketAdminInvitationService,
  BucketAdminService,
  BucketService,
  UserService,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'bucket-admin-inv';

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

describe('bucket admin invitations', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password-1`;
  const accepterEmail = `${FILE_PREFIX}-accepter-${Date.now()}@example.com`;
  const accepterPassword = `${FILE_PREFIX}-accepter-password-1`;
  let rootBucketShortId: string;
  let rootBucketId: string;
  let pendingToken: string;
  let pendingInvitationId: string;

  beforeAll(async () => {
    app = await createApiTestApp();
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'Invitation Owner',
    });
    const accepterHashed = await hashPassword(accepterPassword);
    await UserService.create({
      email: accepterEmail,
      password: accepterHashed,
      displayName: 'Invitation Accepter',
    });
    const root = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: `${FILE_PREFIX}-root`,
      isPublic: true,
    });
    rootBucketShortId = root.shortId;
    rootBucketId = root.id;

    // Create a pending invitation via the service for GET/accept/reject tests
    pendingToken = generateToken();
    const inv = await BucketAdminInvitationService.create({
      bucketId: rootBucketId,
      token: pendingToken,
      bucketCrud: 3,
      bucketMessagesCrud: 3,
      bucketAdminsCrud: 3,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    pendingInvitationId = inv.id;
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
  });

  describe('GET /admin-invitations/:token', () => {
    it('returns 404 for unknown token', async () => {
      await request(app)
        .get(`${API}/admin-invitations/invalid-token-not-found`)
        .expect(404, { message: 'Invitation not found or invalid' });
    });

    it('returns 200 with invitation details for valid pending token', async () => {
      const res = await request(app).get(`${API}/admin-invitations/${pendingToken}`).expect(200);
      expect(res.body.invitation).toBeDefined();
      expect(res.body.invitation.token).toBe(pendingToken);
      expect(res.body.invitation.bucketId).toBe(rootBucketId);
      expect(res.body.invitation.bucketShortId).toBe(rootBucketShortId);
      expect(res.body.invitation.bucketName).toBe(`${FILE_PREFIX}-root`);
      expect(res.body.invitation.bucketCrud).toBe(3);
      expect(res.body.invitation.bucketMessagesCrud).toBe(3);
      // bucketAdminsCrud in response includes READ bit (| 2)
      expect(res.body.invitation.bucketAdminsCrud).toBe(3);
      expect(res.body.invitation.status).toBe('pending');
    });
  });

  describe('POST /admin-invitations/:token/accept', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).post(`${API}/admin-invitations/${pendingToken}/accept`).expect(401);
    });

    it('returns 404 for invalid token', async () => {
      const agent = await createApiLoginAgent(app, {
        email: accepterEmail,
        password: accepterPassword,
      });
      await request(app).post(`${API}/admin-invitations/invalid-token/accept`).expect(401);
      // Use authenticated request with bad token
      await agent
        .post(`${API}/admin-invitations/invalid-token-not-found/accept`)
        .expect(404, { message: 'Invitation not found or invalid' });
    });

    it('returns 200 with accepted:true when authenticated user accepts valid invitation', async () => {
      const agent = await createApiLoginAgent(app, {
        email: accepterEmail,
        password: accepterPassword,
      });
      const res = await agent.post(`${API}/admin-invitations/${pendingToken}/accept`).expect(200);
      expect(res.body.accepted).toBe(true);
      expect(res.body.message).toBe('You have been added as an admin');
    });

    it('creates a bucket_admin row for the accepting user', async () => {
      const accepter = await UserService.findByEmail(accepterEmail);
      expect(accepter).not.toBeNull();
      const admin = await BucketAdminService.findByBucketAndUser(rootBucketId, accepter!.id);
      expect(admin).not.toBeNull();
      expect(admin!.bucketCrud).toBe(3);
      expect(admin!.bucketMessagesCrud).toBe(3);
    });

    it('returns 410 when trying to accept an already-accepted invitation', async () => {
      const agent = await createApiLoginAgent(app, {
        email: accepterEmail,
        password: accepterPassword,
      });
      const res = await agent.post(`${API}/admin-invitations/${pendingToken}/accept`).expect(410);
      expect(res.body.message).toBe('Invitation already accepted');
      expect(res.body.status).toBe('accepted');
    });

    it('returns alreadyAdmin:true when user is already an admin for the bucket', async () => {
      // Create a new invitation and accept it as the owner (who is already admin by ownership)
      const ownerAgent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const ownerIsAdminToken = generateToken();
      await BucketAdminInvitationService.create({
        bucketId: rootBucketId,
        token: ownerIsAdminToken,
        bucketCrud: 0,
        bucketMessagesCrud: 0,
        bucketAdminsCrud: 2,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const res = await ownerAgent
        .post(`${API}/admin-invitations/${ownerIsAdminToken}/accept`)
        .expect(200);
      expect(res.body.alreadyOwner).toBe(true);
    });
  });

  describe('POST /admin-invitations/:token/reject', () => {
    it('returns 401 when unauthenticated', async () => {
      const rejectToken = generateToken();
      await request(app).post(`${API}/admin-invitations/${rejectToken}/reject`).expect(401);
    });

    it('returns 404 for invalid token', async () => {
      const agent = await createApiLoginAgent(app, {
        email: accepterEmail,
        password: accepterPassword,
      });
      await agent
        .post(`${API}/admin-invitations/invalid-token-not-found/reject`)
        .expect(404, { message: 'Invitation not found or invalid' });
    });

    it('returns 200 with rejected:true when authenticated user rejects valid invitation', async () => {
      const rejectToken = generateToken();
      await BucketAdminInvitationService.create({
        bucketId: rootBucketId,
        token: rejectToken,
        bucketCrud: 1,
        bucketMessagesCrud: 2,
        bucketAdminsCrud: 3,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const agent = await createApiLoginAgent(app, {
        email: accepterEmail,
        password: accepterPassword,
      });
      const res = await agent.post(`${API}/admin-invitations/${rejectToken}/reject`).expect(200);
      expect(res.body.rejected).toBe(true);
      expect(res.body.message).toBe('Invitation declined');
    });

    it('returns 410 when trying to reject a non-pending invitation', async () => {
      // pendingToken was already accepted above, so rejecting it should fail
      const agent = await createApiLoginAgent(app, {
        email: accepterEmail,
        password: accepterPassword,
      });
      const res = await agent.post(`${API}/admin-invitations/${pendingToken}/reject`).expect(410);
      expect(res.body.message).toBe('Invitation is no longer pending');
      expect(res.body.status).toBe('accepted');
    });

    it('GET /admin-invitations/:token returns 410 for accepted invitation', async () => {
      const res = await request(app).get(`${API}/admin-invitations/${pendingToken}`).expect(410);
      expect(res.body.message).toBe('Invitation already accepted');
      expect(res.body.status).toBe('accepted');
    });
  });
});
