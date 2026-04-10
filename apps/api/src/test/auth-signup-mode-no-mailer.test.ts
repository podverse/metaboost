/**
 * API integration tests: admin_only_username mode.
 * Signup and email-based verification routes must remain disabled.
 */
process.env.AUTH_MODE = 'admin_only_username';

import type { Express } from 'express';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { UserService } from '@boilerplate/orm';

import { hashPassword } from '../lib/auth/hash.js';

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-signup-mode-no-mailer';

describe('admin_only_username mode', () => {
  let app: Express;
  let API: string;
  let createApiLoginAgent: (
    app: Express,
    credentials: { email: string; password: string }
  ) => Promise<ReturnType<typeof request.agent>>;
  const ts = Date.now();
  const testUserEmail = `${FILE_PREFIX}-${ts}@example.com`;
  const testUserPassword = `${FILE_PREFIX}-password-1`;

  beforeAll(async () => {
    const configMod = await import('../config/index.js');
    const setupMod = await import('./helpers/setup.js');
    const loginAgentMod = await import('./helpers/login-agent.js');
    API = configMod.config.apiVersionPath;
    app = await setupMod.createApiTestApp();
    createApiLoginAgent = loginAgentMod.createApiLoginAgent;
    const hashed = await hashPassword(testUserPassword);
    await UserService.create({
      email: testUserEmail,
      password: hashed,
      displayName: 'Signup Mode No Mailer User',
    });
  });

  afterAll(async () => {
    const setupMod = await import('./helpers/setup.js');
    await setupMod.destroyApiTestDataSources();
  });

  it('POST /auth/signup returns 403 because signup is disabled in admin-only mode', async () => {
    const res = await request(app)
      .post(`${API}/auth/signup`)
      .send({
        email: `${FILE_PREFIX}-new-${Date.now()}@example.com`,
        username: `${FILE_PREFIX}-new-${Date.now()}`,
        password: 'Test!1Aa',
      })
      .expect(403);
    expect(res.body.message).toBe('Registration is by admin only');
  });

  it('verification routes return 403 because email flows are disabled', async () => {
    await request(app)
      .post(`${API}/auth/verify-email`)
      .send({ token: 'any' })
      .expect(403, { message: 'Email verification is not enabled' });

    await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: testUserEmail })
      .expect(403, { message: 'Email verification is not enabled' });

    await request(app)
      .post(`${API}/auth/reset-password`)
      .send({ token: 'any', newPassword: 'Test!1Aa' })
      .expect(403, { message: 'Email verification is not enabled' });

    const authAgent = await createApiLoginAgent(app, {
      email: testUserEmail,
      password: testUserPassword,
    });

    await authAgent
      .post(`${API}/auth/request-email-change`)
      .send({ newEmail: `${FILE_PREFIX}-updated-${Date.now()}@example.com` })
      .expect(403, { message: 'Email verification is not enabled' });

    await request(app)
      .post(`${API}/auth/confirm-email-change`)
      .send({ token: 'any' })
      .expect(403, { message: 'Email verification is not enabled' });
  });
});
