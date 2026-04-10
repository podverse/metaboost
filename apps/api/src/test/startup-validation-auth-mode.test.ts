import { afterEach, describe, expect, it } from 'vitest';

import { TEST_JWT_SECRET_API } from '@boilerplate/helpers';

import { validateStartupRequirements } from '../lib/startup/validation.js';

const ORIGINAL_ENV = { ...process.env };

const withEnv = (overrides: Record<string, string | undefined>): void => {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

/** Minimal mailer-related env for AUTH_MODE email flows (rest from test setup.ts). */
const emailFlowMailerBase = {
  AUTH_MODE: 'admin_only_email',
  API_JWT_SECRET: TEST_JWT_SECRET_API,
  MAILER_HOST: 'localhost',
  MAILER_PORT: '1025',
  MAILER_FROM: 'test@example.com',
  WEB_BASE_URL: 'http://localhost:3000',
  WEB_BRAND_NAME: 'boilerplate-api-test',
} as const;

describe('startup validation auth mode requirements (api)', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('rejects invalid AUTH_MODE values', () => {
    withEnv({
      AUTH_MODE: 'admin_only',
      API_JWT_SECRET: TEST_JWT_SECRET_API,
    });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('requires mailer env when AUTH_MODE=admin_only_email', () => {
    withEnv({
      AUTH_MODE: 'admin_only_email',
      API_JWT_SECRET: TEST_JWT_SECRET_API,
      MAILER_HOST: undefined,
      MAILER_PORT: undefined,
      MAILER_FROM: undefined,
      WEB_BASE_URL: undefined,
      WEB_BRAND_NAME: undefined,
    });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('does not fail startup when optional mailer env is set in admin_only_username mode', () => {
    withEnv({
      AUTH_MODE: 'admin_only_username',
      API_JWT_SECRET: TEST_JWT_SECRET_API,
      MAILER_HOST: 'localhost',
      MAILER_PORT: '25',
      MAILER_FROM: 'test@test.com',
      WEB_BASE_URL: 'http://localhost:3999',
    });
    expect(() => validateStartupRequirements()).not.toThrow();
  });

  it('does not require WEB_BRAND_NAME when AUTH_MODE=admin_only_username', () => {
    withEnv({
      AUTH_MODE: 'admin_only_username',
      API_JWT_SECRET: TEST_JWT_SECRET_API,
      WEB_BRAND_NAME: undefined,
    });
    expect(() => validateStartupRequirements()).not.toThrow();
  });

  it('allows admin_only_email when MAILER_USER and MAILER_PASSWORD are both unset (no SMTP auth)', () => {
    withEnv({
      ...emailFlowMailerBase,
      MAILER_USER: undefined,
      MAILER_PASSWORD: undefined,
    });
    expect(() => validateStartupRequirements()).not.toThrow();
  });

  it('allows admin_only_email when MAILER_USER and MAILER_PASSWORD are both set', () => {
    withEnv({
      ...emailFlowMailerBase,
      MAILER_USER: 'smtp-login@example.com',
      MAILER_PASSWORD: 'xsmtp-secret-key',
    });
    expect(() => validateStartupRequirements()).not.toThrow();
  });

  it('rejects admin_only_email when only MAILER_USER is set', () => {
    withEnv({
      ...emailFlowMailerBase,
      MAILER_USER: 'smtp-login@example.com',
      MAILER_PASSWORD: undefined,
    });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('rejects admin_only_email when only MAILER_PASSWORD is set', () => {
    withEnv({
      ...emailFlowMailerBase,
      MAILER_USER: undefined,
      MAILER_PASSWORD: 'xsmtp-secret-key',
    });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('applies SMTP auth pairing for user_signup_email', () => {
    withEnv({
      ...emailFlowMailerBase,
      AUTH_MODE: 'user_signup_email',
      MAILER_USER: 'u@example.com',
      MAILER_PASSWORD: undefined,
    });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('rejects admin_only_username when MAILER_USER is set', () => {
    withEnv({
      AUTH_MODE: 'admin_only_username',
      API_JWT_SECRET: TEST_JWT_SECRET_API,
      MAILER_USER: 'should-not-be-set',
    });
    expect(() => validateStartupRequirements()).toThrow();
  });
});
