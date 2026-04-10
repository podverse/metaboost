/**
 * API integration tests: locale behavior (mailer-enabled, mocked send).
 * Asserts Accept-Language / DEFAULT_LOCALE → email locale and password validation messages.
 * Flow tests live in auth-mailer.test.ts.
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

import { UserService } from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-locale';

describe('locale (mailer-enabled)', () => {
  let app: Express;
  let API: string;
  const signupPassword = `${FILE_PREFIX}-pass-1`;
  let forgotPasswordUserEmail: string;

  beforeAll(async () => {
    const configMod = await import('../config/index.js');
    const setupMod = await import('./helpers/setup.js');
    API = configMod.config.apiVersionPath;
    app = await setupMod.createApiTestApp();
    forgotPasswordUserEmail = `${FILE_PREFIX}-fp-${Date.now()}@example.com`;
    const hashed = await hashPassword(signupPassword);
    await UserService.create({
      email: forgotPasswordUserEmail,
      password: hashed,
      displayName: 'Locale FP User',
    });
  });

  afterAll(async () => {
    const setupMod = await import('./helpers/setup.js');
    await setupMod.destroyApiTestDataSources();
  });

  describe('signup – verification email locale', () => {
    it('sends verification email with locale es when Accept-Language is es', async () => {
      const ts = Date.now();
      const email = `${FILE_PREFIX}-signup-es-${ts}@example.com`;
      const username = `${FILE_PREFIX}-signup-es-${ts}`;
      captured.verifyLocale = '';
      await request(app)
        .post(`${API}/auth/signup`)
        .set('Accept-Language', 'es')
        .send({ email, username, password: signupPassword, displayName: 'Es User' })
        .expect(201);
      expect(captured.verifyEmail).not.toBe('');
      expect(captured.verifyLocale).toBe('es');
    });

    it('sends verification email with default locale when Accept-Language is missing', async () => {
      const prevDefault = process.env.DEFAULT_LOCALE;
      process.env.DEFAULT_LOCALE = 'en-US';
      const ts = Date.now();
      const email = `${FILE_PREFIX}-signup-default-${ts}@example.com`;
      const username = `${FILE_PREFIX}-signup-default-${ts}`;
      captured.verifyLocale = '';
      try {
        await request(app)
          .post(`${API}/auth/signup`)
          .send({ email, username, password: signupPassword, displayName: 'Default User' })
          .expect(201);
        expect(captured.verifyEmail).not.toBe('');
        expect(captured.verifyLocale).toBe('en-US');
      } finally {
        if (prevDefault !== undefined) process.env.DEFAULT_LOCALE = prevDefault;
        else delete process.env.DEFAULT_LOCALE;
      }
    });

    it('sends verification email with locale en-US when Accept-Language is en-US', async () => {
      const ts = Date.now();
      const email = `${FILE_PREFIX}-signup-en-us-${ts}@example.com`;
      const username = `${FILE_PREFIX}-signup-en-us-${ts}`;
      captured.verifyLocale = '';
      await request(app)
        .post(`${API}/auth/signup`)
        .set('Accept-Language', 'en-US')
        .send({ email, username, password: signupPassword, displayName: 'En-US User' })
        .expect(201);
      expect(captured.verifyEmail).not.toBe('');
      expect(captured.verifyLocale).toBe('en-US');
    });

    it('sends verification email with locale en-US when Accept-Language is en (base)', async () => {
      const ts = Date.now();
      const email = `${FILE_PREFIX}-signup-en-${ts}@example.com`;
      const username = `${FILE_PREFIX}-signup-en-${ts}`;
      captured.verifyLocale = '';
      await request(app)
        .post(`${API}/auth/signup`)
        .set('Accept-Language', 'en')
        .send({ email, username, password: signupPassword, displayName: 'En User' })
        .expect(201);
      expect(captured.verifyEmail).not.toBe('');
      expect(captured.verifyLocale).toBe('en-US');
    });

    it('sends verification email with locale en-US when Accept-Language is en-GB', async () => {
      const ts = Date.now();
      const email = `${FILE_PREFIX}-signup-en-gb-${ts}@example.com`;
      const username = `${FILE_PREFIX}-signup-en-gb-${ts}`;
      captured.verifyLocale = '';
      await request(app)
        .post(`${API}/auth/signup`)
        .set('Accept-Language', 'en-GB')
        .send({ email, username, password: signupPassword, displayName: 'En-GB User' })
        .expect(201);
      expect(captured.verifyEmail).not.toBe('');
      expect(captured.verifyLocale).toBe('en-US');
    });

    it('sends verification email with locale es when Accept-Language is missing and DEFAULT_LOCALE is es', async () => {
      const prevDefault = process.env.DEFAULT_LOCALE;
      process.env.DEFAULT_LOCALE = 'es';
      const ts = Date.now();
      const email = `${FILE_PREFIX}-signup-default-es-${ts}@example.com`;
      const username = `${FILE_PREFIX}-signup-default-es-${ts}`;
      captured.verifyLocale = '';
      try {
        await request(app)
          .post(`${API}/auth/signup`)
          .send({ email, username, password: signupPassword, displayName: 'Default Es User' })
          .expect(201);
        expect(captured.verifyEmail).not.toBe('');
        expect(captured.verifyLocale).toBe('es');
      } finally {
        if (prevDefault !== undefined) process.env.DEFAULT_LOCALE = prevDefault;
        else delete process.env.DEFAULT_LOCALE;
      }
    });

    it('sends verification email with default locale when Accept-Language is unsupported (fr)', async () => {
      const prevDefault = process.env.DEFAULT_LOCALE;
      process.env.DEFAULT_LOCALE = 'en-US';
      const ts = Date.now();
      const email = `${FILE_PREFIX}-signup-fr-${ts}@example.com`;
      const username = `${FILE_PREFIX}-signup-fr-${ts}`;
      captured.verifyLocale = '';
      try {
        await request(app)
          .post(`${API}/auth/signup`)
          .set('Accept-Language', 'fr')
          .send({ email, username, password: signupPassword, displayName: 'Fr User' })
          .expect(201);
        expect(captured.verifyEmail).not.toBe('');
        expect(captured.verifyLocale).toBe('en-US');
      } finally {
        if (prevDefault !== undefined) process.env.DEFAULT_LOCALE = prevDefault;
        else delete process.env.DEFAULT_LOCALE;
      }
    });
  });

  describe('signup – password validation locale', () => {
    it('returns 400 with Spanish password validation message when password too short and Accept-Language is es', async () => {
      const ts = Date.now();
      const res = await request(app)
        .post(`${API}/auth/signup`)
        .set('Accept-Language', 'es')
        .send({
          email: `weak-es-${ts}@example.com`,
          username: `weak-es-${ts}`,
          password: 'short',
          displayName: 'Weak',
        })
        .expect(400);
      expect(res.body.message).toBe('La contraseña debe tener al menos 8 caracteres');
    });

    it('returns 400 with default-locale password validation message when password too short and no Accept-Language', async () => {
      const prevDefault = process.env.DEFAULT_LOCALE;
      process.env.DEFAULT_LOCALE = 'en-US';
      try {
        const ts = Date.now();
        const res = await request(app)
          .post(`${API}/auth/signup`)
          .send({
            email: `weak-default-${ts}@example.com`,
            username: `weak-default-${ts}`,
            password: 'short',
            displayName: 'Weak',
          })
          .expect(400);
        expect(res.body.message).toBe('Password must be at least 8 characters');
      } finally {
        if (prevDefault !== undefined) process.env.DEFAULT_LOCALE = prevDefault;
        else delete process.env.DEFAULT_LOCALE;
      }
    });
  });

  describe('forgot-password – reset email locale', () => {
    it('sends reset email with locale es when Accept-Language is es', async () => {
      captured.passwordReset = '';
      captured.passwordResetLocale = '';
      await request(app)
        .post(`${API}/auth/forgot-password`)
        .set('Accept-Language', 'es')
        .send({ email: forgotPasswordUserEmail })
        .expect(200);
      expect(captured.passwordReset).not.toBe('');
      expect(captured.passwordResetLocale).toBe('es');
    });

    it('sends reset email with DEFAULT_LOCALE when Accept-Language is missing', async () => {
      const prevDefault = process.env.DEFAULT_LOCALE;
      process.env.DEFAULT_LOCALE = 'es';
      captured.passwordReset = '';
      captured.passwordResetLocale = '';
      try {
        await request(app)
          .post(`${API}/auth/forgot-password`)
          .send({ email: forgotPasswordUserEmail })
          .expect(200);
        expect(captured.passwordReset).not.toBe('');
        expect(captured.passwordResetLocale).toBe('es');
      } finally {
        if (prevDefault !== undefined) process.env.DEFAULT_LOCALE = prevDefault;
        else delete process.env.DEFAULT_LOCALE;
      }
    });
  });

  describe('request-email-change – verification email locale', () => {
    it('sends verification email with locale es when Accept-Language is es', async () => {
      const ts = Date.now();
      const emailForLocaleTest = `email-change-locale-${ts}@example.com`;
      const usernameForLocaleTest = `email-change-locale-${ts}`;
      await request(app)
        .post(`${API}/auth/signup`)
        .send({
          email: emailForLocaleTest,
          username: usernameForLocaleTest,
          password: signupPassword,
          displayName: 'Locale Test',
        })
        .expect(201);
      const loginAgentMod = await import('./helpers/login-agent.js');
      const agent = await loginAgentMod.createApiLoginAgent(app, {
        email: emailForLocaleTest,
        password: signupPassword,
      });
      const newEmail = `locale-es-${Date.now()}@example.com`;
      captured.emailChange = '';
      captured.emailChangeLocale = '';
      await agent
        .post(`${API}/auth/request-email-change`)
        .set('Accept-Language', 'es')
        .send({ newEmail })
        .expect(200, { message: 'Verification email sent' });
      expect(captured.emailChange).not.toBe('');
      expect(captured.emailChangeLocale).toBe('es');
    });
  });
});
