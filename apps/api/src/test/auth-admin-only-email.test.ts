process.env.AUTH_MODE = 'admin_only_email';
process.env.MAILER_HOST = 'localhost';
process.env.MAILER_PORT = '25';
process.env.MAILER_FROM = 'test@test.com';
process.env.WEB_BASE_URL = 'http://localhost:3999';

import type { Express } from 'express';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { UserService } from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';

const { captured } = vi.hoisted(() => ({
  captured: {
    passwordReset: '',
    emailChange: '',
  },
}));

vi.mock('../lib/mailer/send.js', () => ({
  isMailerEnabled: () => true,
  sendVerificationEmail: async () => undefined,
  sendPasswordResetEmail: async (_to: string, token: string) => {
    captured.passwordReset = token;
  },
  sendEmailChangeVerificationEmail: async (_to: string, token: string) => {
    captured.emailChange = token;
  },
}));

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-admin-only-email';

describe('admin_only_email mode', () => {
  let app: Express;
  let API: string;
  let createApiLoginAgent: (
    app: Express,
    credentials: { email: string; password: string }
  ) => Promise<ReturnType<typeof request.agent>>;
  const ts = Date.now();
  const userEmail = `${FILE_PREFIX}-${ts}@example.com`;
  const userPassword = `${FILE_PREFIX}-password-1`;

  beforeAll(async () => {
    const configMod = await import('../config/index.js');
    const setupMod = await import('./helpers/setup.js');
    const loginAgentMod = await import('./helpers/login-agent.js');
    API = configMod.config.apiVersionPath;
    app = await setupMod.createApiTestApp();
    createApiLoginAgent = loginAgentMod.createApiLoginAgent;
    await UserService.create({
      email: userEmail,
      password: await hashPassword(userPassword),
      displayName: 'Admin Only Email User',
    });
  });

  afterAll(async () => {
    const setupMod = await import('./helpers/setup.js');
    await setupMod.destroyApiTestDataSources();
  });

  it('POST /auth/signup returns 403 because public signup is disabled', async () => {
    await request(app)
      .post(`${API}/auth/signup`)
      .send({
        email: `${FILE_PREFIX}-new-${Date.now()}@example.com`,
        username: `${FILE_PREFIX}-new-${Date.now()}`,
        password: 'Test!1Aa',
      })
      .expect(403, { message: 'Registration is by admin only' });
  });

  it('forgot/reset and email-change routes are enabled', async () => {
    captured.passwordReset = '';
    await request(app).post(`${API}/auth/forgot-password`).send({ email: userEmail }).expect(200);
    expect(captured.passwordReset).not.toBe('');

    await request(app)
      .post(`${API}/auth/reset-password`)
      .send({ token: 'invalid-token', newPassword: 'Test!1Aa' })
      .expect(400, { message: 'Invalid or expired link' });

    const authAgent = await createApiLoginAgent(app, {
      email: userEmail,
      password: userPassword,
    });
    captured.emailChange = '';
    await authAgent
      .post(`${API}/auth/request-email-change`)
      .send({ newEmail: `updated-${Date.now()}@example.com` })
      .expect(200, { message: 'Verification email sent' });
    expect(captured.emailChange).not.toBe('');

    await request(app)
      .post(`${API}/auth/confirm-email-change`)
      .send({ token: 'invalid-token' })
      .expect(400, { message: 'Invalid or expired link' });
  });
});
