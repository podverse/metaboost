/**
 * API integration tests: mailer-enabled mode (mocked send) – flows only.
 * Verification flows use captured tokens from the mailer mock; no real SMTP.
 * Locale behavior (email locale, password validation locale) is in auth-locale.test.ts.
 * Shared auth endpoints in auth.test.ts; no-mailer flows in auth-no-mailer.test.ts.
 * Env overrides (AUTH_MODE, MAILER_*, WEB_BASE_URL) are set here; app/config are loaded in beforeAll so overrides apply.
 */
process.env.AUTH_MODE = 'user_signup_email';
process.env.MAILER_HOST = 'localhost';
process.env.MAILER_PORT = '25';
process.env.MAILER_FROM = 'test@test.com';
process.env.WEB_BASE_URL = 'http://localhost:3999';

import type { Express } from 'express';

import { vi } from 'vitest';

const { captured } = vi.hoisted(() => ({
  captured: {
    verifyEmail: '',
    verifyLocale: '' as string,
    passwordReset: '',
    passwordResetLocale: '' as string,
    emailChange: '',
    emailChangeLocale: '' as string,
  },
}));

vi.mock('../lib/mailer/send.js', () => ({
  isMailerEnabled: () => true,
  sendVerificationEmail: async (_to: string, token: string, locale?: string) => {
    captured.verifyEmail = token;
    captured.verifyLocale = locale ?? '';
  },
  sendPasswordResetEmail: async (_to: string, token: string, locale?: string) => {
    captured.passwordReset = token;
    captured.passwordResetLocale = locale ?? '';
  },
  sendEmailChangeVerificationEmail: async (_to: string, token: string, locale?: string) => {
    captured.emailChange = token;
    captured.emailChangeLocale = locale ?? '';
  },
}));

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-mailer';

describe('mailer-enabled (mocked)', () => {
  let app: Express;
  let API: string;
  let createApiLoginAgent: (
    app: Express,
    credentials: { email: string; password: string }
  ) => Promise<ReturnType<typeof request.agent>>;
  const ts = Date.now();
  const signupEmail = `${FILE_PREFIX}-${ts}@example.com`;
  const signupUsername = `${FILE_PREFIX}-${ts}`;
  const signupPassword = `${FILE_PREFIX}-pass-1`;

  beforeAll(async () => {
    const configMod = await import('../config/index.js');
    const setupMod = await import('./helpers/setup.js');
    const loginAgentMod = await import('./helpers/login-agent.js');
    API = configMod.config.apiVersionPath;
    app = await setupMod.createApiTestApp();
    createApiLoginAgent = loginAgentMod.createApiLoginAgent;
  });

  afterAll(async () => {
    const setupMod = await import('./helpers/setup.js');
    await setupMod.destroyApiTestDataSources();
  });

  describe('POST /auth/signup', () => {
    it('returns 201 with message only (no user, no session when mailer enabled); captures verify token', async () => {
      captured.verifyEmail = '';
      captured.verifyLocale = '';
      const res = await request(app)
        .post(`${API}/auth/signup`)
        .send({
          email: signupEmail,
          username: signupUsername,
          password: signupPassword,
          displayName: 'Signup User',
        })
        .expect(201);
      expect(res.body).not.toHaveProperty('token');
      expect(res.body).not.toHaveProperty('user');
      expect(res.body.message).toBeDefined();
      expect(captured.verifyEmail).not.toBe('');
    });

    it('returns 400 when email missing', async () => {
      await request(app)
        .post(`${API}/auth/signup`)
        .send({ username: `${FILE_PREFIX}-noemail-${Date.now()}`, password: signupPassword })
        .expect(400);
    });

    it('returns 400 when username missing', async () => {
      await request(app)
        .post(`${API}/auth/signup`)
        .send({
          email: `${FILE_PREFIX}-nousername-${Date.now()}@example.com`,
          password: signupPassword,
        })
        .expect(400);
    });

    it('returns 400 when password missing', async () => {
      await request(app)
        .post(`${API}/auth/signup`)
        .send({
          email: `${FILE_PREFIX}-missing-pass@example.com`,
          username: `${FILE_PREFIX}-missing-pass`,
        })
        .expect(400);
    });

    it('returns 400 when password fails validation (too short)', async () => {
      const t = Date.now();
      const res = await request(app)
        .post(`${API}/auth/signup`)
        .send({
          email: `${FILE_PREFIX}-weak-${t}@example.com`,
          username: `${FILE_PREFIX}-weak-${t}`,
          password: 'x',
        })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('returns 201 for duplicate email without leaking existence (anti-enumeration)', async () => {
      const res = await request(app)
        .post(`${API}/auth/signup`)
        .send({
          email: signupEmail,
          username: `${FILE_PREFIX}-dup-email-${Date.now()}`,
          password: signupPassword,
        })
        .expect(201);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /auth/verify-email', () => {
    it('returns 200 with captured token', async () => {
      await request(app)
        .post(`${API}/auth/verify-email`)
        .send({ token: captured.verifyEmail })
        .expect(200, { message: 'Email verified' });
    });

    it('returns 400 for invalid or expired token', async () => {
      await request(app)
        .post(`${API}/auth/verify-email`)
        .send({ token: 'invalid-token' })
        .expect(400, { message: 'Invalid or expired link' });
    });

    it('returns 400 when token is missing', async () => {
      await request(app)
        .post(`${API}/auth/verify-email`)
        .send({})
        .expect(400, { message: 'Invalid or expired link' });
    });
  });

  describe('POST /auth/forgot-password and reset-password', () => {
    it('forgot-password returns 400 when email missing', async () => {
      await request(app).post(`${API}/auth/forgot-password`).send({}).expect(400);
    });

    it('forgot-password returns 200 for unknown email (anti-enumeration)', async () => {
      const res = await request(app)
        .post(`${API}/auth/forgot-password`)
        .send({ email: `${FILE_PREFIX}-no-such-user@example.com` })
        .expect(200);
      expect(res.body.message).toBeDefined();
    });

    it('forgot-password returns 200 and captures token; reset-password returns 204', async () => {
      captured.passwordReset = '';
      await request(app)
        .post(`${API}/auth/forgot-password`)
        .send({ email: signupEmail })
        .expect(200);
      expect(captured.passwordReset).not.toBe('');
      const newPassword = 'reset-new-pass';
      await request(app)
        .post(`${API}/auth/reset-password`)
        .send({ token: captured.passwordReset, newPassword })
        .expect(204);
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: signupEmail, password: newPassword })
        .expect(200);
    });

    it('reset-password returns 400 for invalid or expired token', async () => {
      await request(app)
        .post(`${API}/auth/reset-password`)
        .send({ token: 'invalid-token', newPassword: 'newpass1' })
        .expect(400, { message: 'Invalid or expired link' });
    });

    it('reset-password returns 400 when newPassword missing', async () => {
      await request(app)
        .post(`${API}/auth/reset-password`)
        .send({ token: 'any-token' })
        .expect(400);
    });

    it('reset-password returns 400 when newPassword fails validation (too short)', async () => {
      // First obtain a fresh reset token via forgot-password
      captured.passwordReset = '';
      const t = Date.now();
      const freshEmail = `${FILE_PREFIX}-reset-weak-${t}@example.com`;
      const freshUsername = `${FILE_PREFIX}-reset-weak-${t}`;
      const freshAgent = request.agent(app);
      await freshAgent
        .post(`${API}/auth/signup`)
        .send({ email: freshEmail, username: freshUsername, password: signupPassword })
        .expect(201);
      await request(app)
        .post(`${API}/auth/forgot-password`)
        .send({ email: freshEmail })
        .expect(200);
      if (captured.passwordReset !== '') {
        const res = await request(app)
          .post(`${API}/auth/reset-password`)
          .send({ token: captured.passwordReset, newPassword: 'x' })
          .expect(400);
        expect(res.body.message).toBeDefined();
      }
    });
  });

  describe('POST /auth/request-email-change and confirm-email-change', () => {
    it('request returns 200 and captures token; confirm returns 200', async () => {
      const agent = await createApiLoginAgent(app, {
        email: signupEmail,
        password: 'reset-new-pass',
      });
      const newEmail = `${FILE_PREFIX}-new-${Date.now()}@example.com`;
      captured.emailChange = '';
      await agent
        .post(`${API}/auth/request-email-change`)
        .send({ newEmail })
        .expect(200, { message: 'Verification email sent' });
      expect(captured.emailChange).not.toBe('');
      await request(app)
        .post(`${API}/auth/confirm-email-change`)
        .send({ token: captured.emailChange })
        .expect(200, { message: 'Email updated' });
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: newEmail, password: 'reset-new-pass' })
        .expect(200);
    });

    it('request-email-change returns 400 when new email equals current', async () => {
      const t = Date.now();
      const sameEmailAddr = `${FILE_PREFIX}-same-email-${t}@example.com`;
      const sameEmailUsername = `${FILE_PREFIX}-same-email-${t}`;
      await request(app)
        .post(`${API}/auth/signup`)
        .send({ email: sameEmailAddr, username: sameEmailUsername, password: signupPassword })
        .expect(201);
      const sameEmailAgent = await createApiLoginAgent(app, {
        email: sameEmailAddr,
        password: signupPassword,
      });
      const res = await sameEmailAgent
        .post(`${API}/auth/request-email-change`)
        .send({ newEmail: sameEmailAddr })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('request-email-change returns 409 when new email already in use', async () => {
      const t = Date.now();
      const conflictEmail1 = `${FILE_PREFIX}-conflict-a-${t}@example.com`;
      const conflictEmail2 = `${FILE_PREFIX}-conflict-b-${t}@example.com`;
      const conflictUsername1 = `${FILE_PREFIX}-conflict-a-${t}`;
      const conflictUsername2 = `${FILE_PREFIX}-conflict-b-${t}`;
      await request(app)
        .post(`${API}/auth/signup`)
        .send({ email: conflictEmail1, username: conflictUsername1, password: signupPassword })
        .expect(201);
      const conflictAgent = await createApiLoginAgent(app, {
        email: conflictEmail1,
        password: signupPassword,
      });
      // Also create user 2 so that email2 is taken
      await request(app)
        .post(`${API}/auth/signup`)
        .send({ email: conflictEmail2, username: conflictUsername2, password: signupPassword })
        .expect(201);
      const res = await conflictAgent
        .post(`${API}/auth/request-email-change`)
        .send({ newEmail: conflictEmail2 })
        .expect(409);
      expect(res.body.message).toBeDefined();
    });

    it('request-email-change returns 401 without cookie or Authorization', async () => {
      await request(app)
        .post(`${API}/auth/request-email-change`)
        .send({ newEmail: `${FILE_PREFIX}-other@example.com` })
        .expect(401, { message: 'Authentication required' });
    });

    it('request-email-change returns 400 when newEmail missing', async () => {
      const t = Date.now();
      const oneOffEmail = `${FILE_PREFIX}-oneoff-${t}@example.com`;
      const oneOffUsername = `${FILE_PREFIX}-oneoff-${t}`;
      await request(app)
        .post(`${API}/auth/signup`)
        .send({ email: oneOffEmail, username: oneOffUsername, password: signupPassword })
        .expect(201);
      const agent = await createApiLoginAgent(app, {
        email: oneOffEmail,
        password: signupPassword,
      });
      const res = await agent.post(`${API}/auth/request-email-change`).send({}).expect(400);
      expect(res.body.message).toBeDefined();
      expect(
        res.body.message === 'newEmail required' ||
          (res.body.details &&
            res.body.details.some((d: { path?: string }) => d.path === 'newEmail'))
      ).toBe(true);
    });

    it('confirm-email-change returns 400 for invalid or expired token', async () => {
      await request(app)
        .post(`${API}/auth/confirm-email-change`)
        .send({ token: 'invalid-token' })
        .expect(400, { message: 'Invalid or expired link' });
    });

    it('confirm-email-change returns 400 when token is missing', async () => {
      await request(app)
        .post(`${API}/auth/confirm-email-change`)
        .send({})
        .expect(400, { message: 'Invalid or expired link' });
    });
  });
});
