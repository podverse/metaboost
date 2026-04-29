/**
 * API integration tests: username and set-password flows.
 * Covers login by username, POST /auth/set-password, signup 409 for duplicate username,
 * PATCH /auth/me (username), GET /auth/username-available.
 * Env (ACCOUNT_SIGNUP_MODE) is applied in `beforeAll` via `apiTestAuthEnv`.
 */
import type { Express } from 'express';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { UserService, VerificationTokenService } from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';
import { generateToken, getSetPasswordExpiry, hashToken } from '../lib/auth/verification-token.js';
import {
  applyUserSignupEmailNoMailerApiTestProcessEnv,
  restoreDefaultApiTestProcessEnv,
} from './helpers/apiTestAuthEnv.js';

const LOGIN_RETRY_ATTEMPTS = 5;
const LOGIN_RETRY_DELAY_MS = 75;

const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const expectLoginByUsernameEventuallySucceeds = async (
  apiPath: string,
  agent: ReturnType<typeof request.agent>,
  username: string,
  password: string
): Promise<void> => {
  let lastStatus: number | null = null;
  for (let attempt = 1; attempt <= LOGIN_RETRY_ATTEMPTS; attempt += 1) {
    const res = await agent.post(`${apiPath}/auth/login`).send({ email: username, password });
    lastStatus = res.status;
    if (res.status === 200) {
      return;
    }
    if (attempt < LOGIN_RETRY_ATTEMPTS) {
      await delay(LOGIN_RETRY_DELAY_MS);
    }
  }
  throw new Error(
    `Expected login by updated username to return 200, got ${lastStatus} after ${LOGIN_RETRY_ATTEMPTS} attempts`
  );
};

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-username';

describe('auth (username and set-password)', () => {
  let app: Express;
  let API: string;
  let createApiLoginAgent: (
    app: Express,
    credentials: { email: string; password: string }
  ) => Promise<ReturnType<typeof request.agent>>;
  const ts = Date.now();
  const testUserEmail = `${FILE_PREFIX}-${ts}@example.com`;
  const testUserUsername = `${FILE_PREFIX}-${ts}`;
  const testUserPassword = `${FILE_PREFIX}-password-1`;

  beforeAll(async () => {
    applyUserSignupEmailNoMailerApiTestProcessEnv();
    const configMod = await import('../config/index.js');
    const setupMod = await import('./helpers/setup.js');
    const loginAgentMod = await import('./helpers/login-agent.js');
    API = configMod.config.apiVersionPath;
    app = await setupMod.createApiTestApp();
    createApiLoginAgent = loginAgentMod.createApiLoginAgent;
    const hashed = await hashPassword(testUserPassword);
    await UserService.create({
      email: testUserEmail,
      username: testUserUsername,
      password: hashed,
      displayName: 'Username Test User',
    });
  });

  afterAll(async () => {
    const setupMod = await import('./helpers/setup.js');
    await setupMod.destroyApiTestDataSources();
    restoreDefaultApiTestProcessEnv();
  });

  describe('POST /auth/login (by username)', () => {
    it('returns 200 with user when logging in with username', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserUsername, password: testUserPassword })
        .expect(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(testUserUsername);
      expect(res.body.user.email).toBe(testUserEmail);
    });

    it('returns 401 for unknown username', async () => {
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: 'nonexistent-username', password: 'any' })
        .expect(401);
    });
  });

  describe('POST /auth/set-password', () => {
    it('returns 204 and allows login after setting password', async () => {
      const placeholderHash = await hashPassword('placeholder');
      const usernameOnly = `setpw-${Date.now()}`;
      const user = await UserService.create({
        username: usernameOnly,
        password: placeholderHash,
        displayName: null,
      });
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      await VerificationTokenService.createToken(
        user.id,
        'set_password',
        tokenHash,
        getSetPasswordExpiry(),
        null
      );
      const newPassword = 'new-set-password-1';
      await request(app)
        .post(`${API}/auth/set-password`)
        .send({ token: rawToken, newPassword })
        .expect(204);
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: usernameOnly, password: newPassword })
        .expect(200);
    });

    it('returns 400 for invalid or expired token', async () => {
      await request(app)
        .post(`${API}/auth/set-password`)
        .send({ token: 'invalid-token', newPassword: 'validpass1' })
        .expect(400, { message: 'Invalid or expired link' });
    });

    it('returns 400 when newPassword fails validation', async () => {
      const placeholderHash = await hashPassword('placeholder');
      const usernameOnly = `setpw-weak-${Date.now()}`;
      const user = await UserService.create({
        username: usernameOnly,
        password: placeholderHash,
        displayName: null,
      });
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      await VerificationTokenService.createToken(
        user.id,
        'set_password',
        tokenHash,
        getSetPasswordExpiry(),
        null
      );
      const res = await request(app)
        .post(`${API}/auth/set-password`)
        .send({ token: rawToken, newPassword: 'x' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /auth/signup (username uniqueness)', () => {
    it('returns 409 when username already in use', async () => {
      const res = await request(app)
        .post(`${API}/auth/signup`)
        .send({
          email: `other-${Date.now()}@example.com`,
          username: testUserUsername,
          password: 'somepass1',
        })
        .expect(409);
      expect(res.body.message).toBe('Username already in use');
    });
  });

  describe('PATCH /auth/me (username)', () => {
    it('returns 200 with updated user when setting username', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const newUsername = `updated-username-${Date.now()}`;
      const res = await agent.patch(`${API}/auth/me`).send({ username: newUsername }).expect(200);
      expect(res.body.user.username).toBe(newUsername);
      await expectLoginByUsernameEventuallySucceeds(API, agent, newUsername, testUserPassword);
    });

    it('returns 409 when username already taken by another user', async () => {
      const otherUsername = `other-user-${Date.now()}`;
      const otherHashed = await hashPassword('otherpass1');
      await UserService.create({
        email: `other-${Date.now()}@example.com`,
        username: otherUsername,
        password: otherHashed,
        displayName: null,
      });
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const res = await agent.patch(`${API}/auth/me`).send({ username: otherUsername }).expect(409);
      expect(res.body.message).toBe('Username already in use');
    });
  });

  describe('GET /auth/username-available', () => {
    it('returns available: true for unused username', async () => {
      const res = await request(app)
        .get(`${API}/auth/username-available`)
        .query({ username: `available-${Date.now()}` })
        .expect(200);
      expect(res.body.available).toBe(true);
    });

    it('returns available: false for taken username', async () => {
      const taken = `taken-${Date.now()}`;
      const hashed = await hashPassword('pass');
      await UserService.create({
        email: `taken-${Date.now()}@example.com`,
        username: taken,
        password: hashed,
        displayName: null,
      });
      const res = await request(app)
        .get(`${API}/auth/username-available`)
        .query({ username: taken })
        .expect(200);
      expect(res.body.available).toBe(false);
    });

    it('returns available: true when authenticated user checks own username', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const loginRes = await agent.get(`${API}/auth/me`).expect(200);
      const ownUsername =
        loginRes.body.user?.username ?? loginRes.body.user?.email ?? testUserUsername;
      const res = await agent
        .get(`${API}/auth/username-available`)
        .query({ username: ownUsername })
        .expect(200);
      expect(res.body.available).toBe(true);
    });

    it('returns available: false when username is empty', async () => {
      const res = await request(app)
        .get(`${API}/auth/username-available`)
        .query({ username: '' })
        .expect(200);
      expect(res.body.available).toBe(false);
    });
  });
});
