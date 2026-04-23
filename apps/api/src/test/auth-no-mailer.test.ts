import request from 'supertest';
/**
 * API integration tests: no-mailer mode (admin-only).
 * Mailer is disabled; signup returns 403 and verification routes return 403.
 * Shared auth behavior is in auth.test.ts; mailer-enabled flows in auth-mailer.test.ts.
 */
import { afterAll, beforeAll, describe, it } from 'vitest';

import { UserService } from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { restoreDefaultApiTestProcessEnv } from './helpers/apiTestAuthEnv.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-no-mailer';

describe('no-mailer (admin-only)', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let authAgent: ReturnType<typeof request.agent>;
  let API: string;
  const testUserEmail = `${FILE_PREFIX}-${Date.now()}@example.com`;
  const testUserPassword = `${FILE_PREFIX}-password-1`;

  beforeAll(async () => {
    restoreDefaultApiTestProcessEnv();
    const { config } = await import('../config/index.js');
    API = config.apiVersionPath;
    app = await createApiTestApp();
    const hashed = await hashPassword(testUserPassword);
    await UserService.create({
      email: testUserEmail,
      password: hashed,
      displayName: 'No-Mailer User',
    });
    authAgent = await createApiLoginAgent(app, {
      email: testUserEmail,
      password: testUserPassword,
    });
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
    restoreDefaultApiTestProcessEnv();
  });

  describe('POST /auth/signup returns 403 when signup disabled', () => {
    it('returns 403', async () => {
      await request(app)
        .post(`${API}/auth/signup`)
        .send({
          email: `${FILE_PREFIX}-new@example.com`,
          username: `${FILE_PREFIX}-newuser`,
          password: 'pass',
        })
        .expect(403, { message: 'Registration is by admin only' });
    });
  });

  describe('verification routes return 403 when mailer disabled', () => {
    it('POST /auth/verify-email returns 403', async () => {
      await request(app)
        .post(`${API}/auth/verify-email`)
        .send({ token: 'any' })
        .expect(403, { message: 'Email verification is not enabled' });
    });

    it('POST /auth/forgot-password returns 403', async () => {
      await request(app)
        .post(`${API}/auth/forgot-password`)
        .send({ email: 'a@b.com' })
        .expect(403, { message: 'Email verification is not enabled' });
    });

    it('POST /auth/reset-password returns 403', async () => {
      await request(app)
        .post(`${API}/auth/reset-password`)
        .send({ token: 'any', newPassword: 'new' })
        .expect(403, { message: 'Email verification is not enabled' });
    });

    it('POST /auth/request-email-change returns 403', async () => {
      await authAgent
        .post(`${API}/auth/request-email-change`)
        .send({ newEmail: 'other@example.com' })
        .expect(403, { message: 'Email verification is not enabled' });
    });

    it('POST /auth/confirm-email-change returns 403', async () => {
      await request(app)
        .post(`${API}/auth/confirm-email-change`)
        .send({ token: 'any' })
        .expect(403, { message: 'Email verification is not enabled' });
    });
  });
});
