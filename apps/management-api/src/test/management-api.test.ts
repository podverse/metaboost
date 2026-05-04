/**
 * Management API integration tests: auth, admins CRUD, events.
 * Requires main and management test DBs to exist and be initialized.
 * For root routes see root-routes.test.ts.
 */
import crypto from 'crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AUTH_MESSAGE_INVALID_CREDENTIALS, MS_PER_SECOND, ONE_MINUTE_MS } from '@metaboost/helpers';
import { VerificationToken, appDataSourceRead } from '@metaboost/orm';

import { config } from '../config/index.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'mgmt-api';
const superAdminUsername = `${FILE_PREFIX}-super-admin`;
const superAdminPassword = `${FILE_PREFIX}-super-admin-password-1`;

describe('management-api', () => {
  let app: Awaited<ReturnType<typeof createManagementApiTestAppWithSuperAdmin>>;
  let superAdminAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await createManagementApiTestAppWithSuperAdmin(superAdminUsername, superAdminPassword);
    superAdminAgent = await createManagementLoginAgent(app, {
      username: superAdminUsername,
      password: superAdminPassword,
    });
  });

  afterAll(async () => {
    await destroyManagementApiTestDataSources();
  });

  describe('Swagger versioned /api-docs', () => {
    it('GET {API_VERSION_PATH}/api-docs returns 200 (Swagger UI)', async () => {
      const res = await request(app).get(`${API}/api-docs/`).expect(200);
      expect(res.text).toContain('swagger');
    });
  });

  describe('POST /auth/login', () => {
    it('returns 400 when username or password missing', async () => {
      await request(app).post(`${API}/auth/login`).send({}).expect(400);
      await request(app).post(`${API}/auth/login`).send({ username: 'a' }).expect(400);
      await request(app).post(`${API}/auth/login`).send({ password: 'x' }).expect(400);
    });

    it('returns 401 for unknown username', async () => {
      await request(app)
        .post(`${API}/auth/login`)
        .send({ username: `${FILE_PREFIX}-unknown-user`, password: 'any' })
        .expect(401, { message: AUTH_MESSAGE_INVALID_CREDENTIALS });
    });

    it('returns 401 for wrong password', async () => {
      await request(app)
        .post(`${API}/auth/login`)
        .send({ username: superAdminUsername, password: 'wrong' })
        .expect(401, { message: AUTH_MESSAGE_INVALID_CREDENTIALS });
    });

    it('returns 200 with user and Set-Cookie (no token in body) for valid credentials', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ username: superAdminUsername, password: superAdminPassword })
        .expect(200);
      expect(res.body).not.toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(superAdminUsername);
      expect(res.body.user.isSuperAdmin).toBe(true);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 without cookie or Authorization', async () => {
      await request(app).get(`${API}/auth/me`).expect(401);
    });

    it('returns 200 with user when authenticated via cookie', async () => {
      const res = await superAdminAgent.get(`${API}/auth/me`).expect(200);
      expect(res.body.user.username).toBe(superAdminUsername);
      expect(res.body.user.isSuperAdmin).toBe(true);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 204 without auth', async () => {
      await request(app).post(`${API}/auth/logout`).expect(204);
    });

    it('returns 204 and clears cookies when authenticated', async () => {
      const tempAgent = await createManagementLoginAgent(app, {
        username: superAdminUsername,
        password: superAdminPassword,
      });
      const res = await tempAgent.post(`${API}/auth/logout`).expect(204);
      const setCookie = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      const sessionCleared = cookies.some(
        (c: string) => c.startsWith(config.sessionCookieName + '=;') || c.includes('Max-Age=0')
      );
      const refreshCleared = cookies.some(
        (c: string) => c.startsWith(config.refreshCookieName + '=;') || c.includes('Max-Age=0')
      );
      expect(sessionCleared).toBe(true);
      expect(refreshCleared).toBe(true);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns 401 without refresh cookie', async () => {
      await request(app).post(`${API}/auth/refresh`).expect(401);
    });

    it('returns 401 with invalid refresh token', async () => {
      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .set('Cookie', `${config.refreshCookieName}=invalid-token`)
        .expect(401);
      expect(res.body.message).toBe('Invalid or expired session');
    });

    it('returns 200 with user and new cookies for valid refresh token', async () => {
      const refreshAgent = await createManagementLoginAgent(app, {
        username: superAdminUsername,
        password: superAdminPassword,
      });
      const res = await refreshAgent.post(`${API}/auth/refresh`).expect(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(superAdminUsername);
      const setCookie = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      expect(cookies.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /events', () => {
    it('returns 401 without auth', async () => {
      await request(app).get(`${API}/events`).expect(401);
    });

    it('returns 200 with events array and pagination fields when authenticated', async () => {
      const res = await superAdminAgent.get(`${API}/events`).expect(200);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.page).toBe('number');
      expect(typeof res.body.limit).toBe('number');
      expect(typeof res.body.totalPages).toBe('number');
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe('admins CRUD (super admin)', () => {
    let adminId: string;
    const adminUsername = `${FILE_PREFIX}-admin-${Date.now()}`;
    const adminPassword = `${FILE_PREFIX}-admin-password-1`;

    it('GET /admins returns 401 without auth', async () => {
      await request(app).get(`${API}/admins`).expect(401);
    });

    it('GET /admins/:id returns 401 without auth', async () => {
      await request(app).get(`${API}/admins/nonexistent-id`).expect(401);
    });

    it('POST /admins returns 401 without auth', async () => {
      await request(app)
        .post(`${API}/admins`)
        .send({ username: 'x', password: 'p', displayName: 'd' })
        .expect(401);
    });

    it('PATCH /admins/:id returns 401 without auth', async () => {
      await request(app)
        .patch(`${API}/admins/nonexistent-id`)
        .send({ displayName: 'x' })
        .expect(401);
    });

    it('DELETE /admins/:id returns 401 without auth', async () => {
      await request(app).delete(`${API}/admins/nonexistent-id`).expect(401);
    });

    it('POST /admins/change-password returns 401 without auth', async () => {
      await request(app)
        .post(`${API}/admins/change-password`)
        .send({ currentPassword: 'x', newPassword: 'y' })
        .expect(401);
    });

    it('POST /admins creates admin and returns 201', async () => {
      const res = await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: adminUsername,
          password: adminPassword,
          displayName: 'Test Admin',
          adminsCrud: 0,
          usersCrud: 15,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      expect(res.body.admin).toHaveProperty('id');
      expect(res.body.admin.username).toBe(adminUsername);
      expect(res.body.admin.displayName).toBe('Test Admin');
      expect(res.body.admin.isSuperAdmin).toBe(false);
      adminId = res.body.admin.id;
    });

    it('GET /admins returns list including new admin', async () => {
      const res = await superAdminAgent.get(`${API}/admins`).expect(200);
      expect(res.body.admins).toBeDefined();
      const found = res.body.admins.find((a: { id: string }) => a.id === adminId);
      expect(found).toBeDefined();
      expect(found.username).toBe(adminUsername);
    });

    it('GET /admins/:id returns admin', async () => {
      const res = await superAdminAgent.get(`${API}/admins/${adminId}`).expect(200);
      expect(res.body.admin.id).toBe(adminId);
      expect(res.body.admin.username).toBe(adminUsername);
    });

    it('GET /admins/:id returns 404 for nonexistent id', async () => {
      await superAdminAgent
        .get(`${API}/admins/00000000-0000-0000-0000-000000000000`)
        .expect(404, { message: 'Admin not found' });
    });

    it('PATCH /admins/:id updates admin', async () => {
      const res = await superAdminAgent
        .patch(`${API}/admins/${adminId}`)
        .send({ displayName: 'Updated Admin' })
        .expect(200);
      expect(res.body.admin.displayName).toBe('Updated Admin');
    });

    it('PATCH /admins/:id returns 404 for nonexistent id', async () => {
      await superAdminAgent
        .patch(`${API}/admins/00000000-0000-0000-0000-000000000000`)
        .send({ displayName: 'Ghost' })
        .expect(404);
    });

    it('POST /admins returns 409 when username already in use', async () => {
      await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: adminUsername,
          password: 'another-password',
          displayName: `Dup Admin ${Date.now()}`,
          adminsCrud: 0,
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(409, { message: 'Username already in use' });
    });

    it('POST /admins/change-password returns 401 when current password wrong', async () => {
      const adminAgent = await createManagementLoginAgent(app, {
        username: adminUsername,
        password: adminPassword,
      });
      await adminAgent
        .post(`${API}/admins/change-password`)
        .send({ currentPassword: 'wrong-password', newPassword: 'new-admin-pass' })
        .expect(401, { message: 'Current password is incorrect' });
    });

    it('POST /admins/change-password changes own password', async () => {
      const adminAgent = await createManagementLoginAgent(app, {
        username: adminUsername,
        password: adminPassword,
      });
      const newPassword = 'admin-password-2';
      await adminAgent
        .post(`${API}/admins/change-password`)
        .send({ currentPassword: adminPassword, newPassword })
        .expect(204);
      await request(app)
        .post(`${API}/auth/login`)
        .send({ username: adminUsername, password: newPassword })
        .expect(200);
    });

    it('DELETE /admins/:id removes admin', async () => {
      await superAdminAgent.delete(`${API}/admins/${adminId}`).expect(204);
      await superAdminAgent.get(`${API}/admins/${adminId}`).expect(404);
    });
  });

  describe('users CRUD (super admin, main DB)', () => {
    let userId: string;
    const userEmail = `${FILE_PREFIX}-user-crud-${Date.now()}@example.com`;
    const userPassword = 'user-password-1';

    it('GET /users returns 401 without auth', async () => {
      await request(app).get(`${API}/users`).expect(401);
    });

    it('POST /users returns 401 without auth', async () => {
      await request(app)
        .post(`${API}/users`)
        .send({ email: 'x@x.com', password: 'password1' })
        .expect(401);
    });

    it('POST /users returns 400 when neither email nor username', async () => {
      await superAdminAgent.post(`${API}/users`).send({ displayName: 'No identifier' }).expect(400);
    });

    it('GET /users returns 200 with users array', async () => {
      const res = await superAdminAgent.get(`${API}/users`).expect(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('POST /users creates main-app user and GET /users/:id returns it', async () => {
      const createRes = await superAdminAgent
        .post(`${API}/users`)
        .send({
          email: userEmail,
          password: userPassword,
          displayName: 'Test User',
        })
        .expect(201);
      expect(createRes.body.user).toHaveProperty('id');
      expect(createRes.body.user.email).toBe(userEmail);
      userId = createRes.body.user.id;

      const getRes = await superAdminAgent.get(`${API}/users/${userId}`).expect(200);
      expect(getRes.body.user.id).toBe(userId);
      expect(getRes.body.user.email).toBe(userEmail);
    });

    it('GET /users/:id returns 404 for nonexistent id', async () => {
      await superAdminAgent
        .get(`${API}/users/00000000-0000-0000-0000-000000000000`)
        .expect(404, { message: 'User not found' });
    });

    it('POST /users returns 409 when email already in use', async () => {
      await superAdminAgent
        .post(`${API}/users`)
        .send({
          email: userEmail,
          password: userPassword,
          displayName: 'Duplicate User',
        })
        .expect(409, { message: 'Email already in use' });
    });

    it('POST /users creates user with username only and returns setPasswordLink', async () => {
      const usernameOnly = `${FILE_PREFIX}-username-only-${Date.now()}`;
      const startedAtMs = Date.now();
      const res = await superAdminAgent
        .post(`${API}/users`)
        .send({ username: usernameOnly, displayName: 'Username Only User' })
        .expect(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toBe(usernameOnly);
      expect(res.body.user.email).toBeNull();
      expect(res.body.setPasswordLink).toBeDefined();
      expect(typeof res.body.setPasswordLink).toBe('string');
      expect(res.body.setPasswordLink).toContain('/auth/set-password');

      const setPasswordUrl = new URL(res.body.setPasswordLink, 'http://localhost');
      const rawToken = setPasswordUrl.searchParams.get('token');
      expect(rawToken).toBeTruthy();

      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken ?? '', 'utf8')
        .digest('hex');
      const verificationTokenRepo = appDataSourceRead.getRepository(VerificationToken);
      const tokenRecord = await verificationTokenRepo.findOne({
        where: { tokenHash, kind: 'set_password', userId: res.body.user.id },
      });

      expect(tokenRecord).not.toBeNull();
      if (tokenRecord !== null) {
        const expectedTtlMs = config.userInvitationExpiration * MS_PER_SECOND;
        const elapsedMs = tokenRecord.expiresAt.getTime() - startedAtMs;
        const lowerBound = expectedTtlMs - ONE_MINUTE_MS;
        const upperBound = expectedTtlMs + ONE_MINUTE_MS;
        expect(elapsedMs).toBeGreaterThanOrEqual(lowerBound);
        expect(elapsedMs).toBeLessThanOrEqual(upperBound);
      }
      await superAdminAgent.delete(`${API}/users/${res.body.user.id}`).expect(204);
    });

    it('POST /users creates user with email only and no password returns setPasswordLink', async () => {
      const emailOnly = `${FILE_PREFIX}-email-only-${Date.now()}@example.com`;
      const res = await superAdminAgent
        .post(`${API}/users`)
        .send({ email: emailOnly, displayName: 'Email Only User' })
        .expect(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(emailOnly);
      expect(res.body.setPasswordLink).toBeDefined();
      await superAdminAgent.delete(`${API}/users/${res.body.user.id}`).expect(204);
    });

    it('POST /users returns 409 when username already in use', async () => {
      const takenUsername = `${FILE_PREFIX}-taken-username-${Date.now()}`;
      const first = await superAdminAgent
        .post(`${API}/users`)
        .send({ username: takenUsername, password: userPassword })
        .expect(201);
      await superAdminAgent
        .post(`${API}/users`)
        .send({ username: takenUsername, email: `${FILE_PREFIX}-other-${Date.now()}@example.com` })
        .expect(409, { message: 'Username already in use' });
      await superAdminAgent.delete(`${API}/users/${first.body.user.id}`).expect(204);
    });

    it('PATCH /users/:id updates user', async () => {
      const res = await superAdminAgent
        .patch(`${API}/users/${userId}`)
        .send({ displayName: 'Updated User' })
        .expect(200);
      expect(res.body.user.displayName).toBe('Updated User');
    });

    it('PATCH /users/:id returns 404 for nonexistent id', async () => {
      await superAdminAgent
        .patch(`${API}/users/00000000-0000-0000-0000-000000000000`)
        .send({ displayName: 'Ghost' })
        .expect(404, { message: 'User not found' });
    });

    it('PATCH /users/:id returns 401 without auth', async () => {
      await request(app)
        .patch(`${API}/users/${userId}`)
        .send({ displayName: 'Unauthorized' })
        .expect(401);
    });

    it('POST /users/:id/change-password changes user password (super admin)', async () => {
      const newPassword = 'user-password-2';
      await superAdminAgent
        .post(`${API}/users/${userId}/change-password`)
        .send({ newPassword })
        .expect(204);
    });

    it('POST /users/:id/change-password returns 404 for nonexistent user', async () => {
      await superAdminAgent
        .post(`${API}/users/00000000-0000-0000-0000-000000000000/change-password`)
        .send({ newPassword: 'new-pass-1' })
        .expect(404, { message: 'User not found' });
    });

    it('DELETE /users/:id removes user', async () => {
      await superAdminAgent.delete(`${API}/users/${userId}`).expect(204);
      await superAdminAgent.get(`${API}/users/${userId}`).expect(404);
    });

    it('DELETE /users/:id returns 404 for nonexistent id', async () => {
      await superAdminAgent
        .delete(`${API}/users/00000000-0000-0000-0000-000000000000`)
        .expect(404, { message: 'User not found' });
    });

    it('DELETE /users/:id returns 401 without auth', async () => {
      await request(app).delete(`${API}/users/00000000-0000-0000-0000-000000000000`).expect(401);
    });
  });

  describe('actorDisplayName behavior', () => {
    const actorEmail = `actor-dn-${Date.now()}@example.com`;
    const actorPassword = 'actor-dn-password-1';
    let actorId: string;
    let actorAgent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
      const res = await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: actorEmail,
          password: actorPassword,
          displayName: 'ActorOriginalName',
          adminsCrud: 0,
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      actorId = res.body.admin.id;
      actorAgent = await createManagementLoginAgent(app, {
        username: actorEmail,
        password: actorPassword,
      });
    });

    afterAll(async () => {
      await superAdminAgent.delete(`${API}/admins/${actorId}`).catch(() => undefined);
    });

    it('actorDisplayName is stored on events at creation time', async () => {
      await actorAgent
        .post(`${API}/admins/change-password`)
        .send({ currentPassword: actorPassword, newPassword: 'actor-dn-password-2' })
        .expect(204);

      const res = await superAdminAgent.get(`${API}/events`).expect(200);
      const actorEvent = res.body.events.find(
        (e: { actorId: string; actorDisplayName: string | null }) => e.actorId === actorId
      );
      expect(actorEvent).toBeDefined();
      expect(actorEvent.actorDisplayName).toBe('ActorOriginalName');
    });

    it('actorDisplayName is updated in past events when admin displayName changes', async () => {
      await superAdminAgent
        .patch(`${API}/admins/${actorId}`)
        .send({ displayName: 'ActorUpdatedName' })
        .expect(200);

      const res = await superAdminAgent.get(`${API}/events`).expect(200);
      const actorEvents = res.body.events.filter((e: { actorId: string }) => e.actorId === actorId);
      expect(actorEvents.length).toBeGreaterThan(0);
      for (const e of actorEvents) {
        expect(e.actorDisplayName).toBe('ActorUpdatedName');
      }
    });

    it('events survive admin deletion (non-cascading)', async () => {
      await superAdminAgent.delete(`${API}/admins/${actorId}`).expect(204);
      actorId = '';

      const res = await superAdminAgent.get(`${API}/events`).expect(200);
      const survivingEvent = res.body.events.find(
        (e: { actorDisplayName: string | null }) => e.actorDisplayName === 'ActorUpdatedName'
      );
      expect(survivingEvent).toBeDefined();
    });
  });
});
