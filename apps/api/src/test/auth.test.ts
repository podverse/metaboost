import request from 'supertest';
/**
 * API integration tests: auth endpoints unaffected by mailer mode.
 * Covers login, logout, me, change-password.
 * For root routes see root-routes.test.ts; for mode-specific flows see auth-no-mailer.test.ts and auth-mailer.test.ts.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AUTH_MESSAGE_INVALID_CREDENTIALS } from '@metaboost/helpers';
import { UserService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-shared';

describe('auth (shared)', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  const testUserEmail = `${FILE_PREFIX}-${Date.now()}@example.com`;
  const testUserPassword = `${FILE_PREFIX}-password-1`;

  beforeAll(async () => {
    app = await createApiTestApp();
    const hashed = await hashPassword(testUserPassword);
    await UserService.create({
      email: testUserEmail,
      password: hashed,
      displayName: 'Test User',
    });
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
  });

  describe('POST /auth/login', () => {
    it('returns 400 when email or password missing', async () => {
      await request(app).post(`${API}/auth/login`).send({}).expect(400);
      await request(app).post(`${API}/auth/login`).send({ email: 'a@b.com' }).expect(400);
      await request(app).post(`${API}/auth/login`).send({ password: 'x' }).expect(400);
    });

    it('returns 401 for unknown email', async () => {
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: 'unknown@example.com', password: 'any' })
        .expect(401, { message: AUTH_MESSAGE_INVALID_CREDENTIALS });
    });

    it('returns 401 for wrong password', async () => {
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: 'wrong-password' })
        .expect(401, { message: AUTH_MESSAGE_INVALID_CREDENTIALS });
    });

    it('returns 200 with user and Set-Cookie (no token in body) for valid credentials', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: testUserPassword })
        .expect(200);
      expect(res.body).not.toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(testUserEmail);
      expect(res.body.user.displayName).toBe('Test User');
      const setCookie = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      expect(cookies.length).toBeGreaterThanOrEqual(2);
      expect(cookies.some((c: string) => c.startsWith(config.sessionCookieName + '='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith(config.refreshCookieName + '='))).toBe(true);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 204 without auth', async () => {
      await request(app).post(`${API}/auth/logout`).expect(204);
    });

    it('returns 204 and clears cookies when authenticated', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const res = await agent.post(`${API}/auth/logout`).expect(204);
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

  describe('GET /auth/me', () => {
    it('returns 401 without cookie or Authorization', async () => {
      await request(app).get(`${API}/auth/me`).expect(401);
    });

    it('returns 401 with invalid Bearer token', async () => {
      await request(app)
        .get(`${API}/auth/me`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('returns 200 with user when authenticated via Bearer token', async () => {
      const loginRes = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: testUserPassword })
        .expect(200);
      const setCookie: string[] | string | undefined = loginRes.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      const sessionCookie = cookies.find((c: string) =>
        c.startsWith(config.sessionCookieName + '=')
      );
      expect(sessionCookie).toBeDefined();
      if (sessionCookie === undefined) return;
      const token = sessionCookie.split(';')[0].split('=').slice(1).join('=');
      const res = await request(app)
        .get(`${API}/auth/me`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.user.email).toBe(testUserEmail);
    });

    it('returns 200 with user when authenticated via cookie', async () => {
      const loginRes = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: testUserPassword });
      expect(
        loginRes.status,
        `Expected login to succeed before cookie-auth /auth/me check, received status ${loginRes.status} with body ${JSON.stringify(loginRes.body)}`
      ).toBe(200);
      const setCookie = loginRes.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      expect(cookies.length).toBeGreaterThan(0);
      const cookieHeader = cookies.map((cookie) => cookie.split(';')[0]).join('; ');
      expect(cookieHeader).not.toBe('');
      const res = await request(app).get(`${API}/auth/me`).set('Cookie', cookieHeader).expect(200);
      expect(res.body.user.email).toBe(testUserEmail);
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

    it('returns 200 with user and new cookies when refresh cookie valid', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const res = await agent.post(`${API}/auth/refresh`).expect(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUserEmail);
      const setCookie = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      expect(cookies.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /auth/change-password', () => {
    it('returns 401 without auth', async () => {
      await request(app)
        .post(`${API}/auth/change-password`)
        .send({ currentPassword: 'x', newPassword: 'y' })
        .expect(401);
    });

    it('returns 400 when currentPassword or newPassword missing', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      await agent.post(`${API}/auth/change-password`).send({ newPassword: 'new1' }).expect(400);
      await agent.post(`${API}/auth/change-password`).send({ currentPassword: 'old' }).expect(400);
    });

    it('returns 400 when newPassword fails validation (too short)', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const res = await agent
        .post(`${API}/auth/change-password`)
        .send({ currentPassword: testUserPassword, newPassword: 'x' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('returns 401 when current password wrong', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      await agent
        .post(`${API}/auth/change-password`)
        .send({ currentPassword: 'wrong', newPassword: 'new-pass' })
        .expect(401, { message: 'Current password is incorrect' });
    });

    it('returns 204 and allows login with new password', async () => {
      const newPassword = 'new-password-2';
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      await agent
        .post(`${API}/auth/change-password`)
        .send({ currentPassword: testUserPassword, newPassword })
        .expect(204);
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: newPassword })
        .expect(200);
    });
  });
});
