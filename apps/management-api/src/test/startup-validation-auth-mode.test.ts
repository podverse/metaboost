import { afterEach, describe, expect, it } from 'vitest';

import { TEST_JWT_SECRET_MANAGEMENT_API } from '@boilerplate/helpers';

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

describe('startup validation auth mode requirements (management-api)', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('rejects missing AUTH_MODE', () => {
    withEnv({
      AUTH_MODE: undefined,
      MANAGEMENT_API_JWT_SECRET: TEST_JWT_SECRET_MANAGEMENT_API,
    });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('rejects invalid AUTH_MODE values', () => {
    withEnv({
      AUTH_MODE: 'admin_only',
      MANAGEMENT_API_JWT_SECRET: TEST_JWT_SECRET_MANAGEMENT_API,
    });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('requires MANAGEMENT_API_USER_INVITATION_TTL_HOURS to be positive integer', () => {
    withEnv({
      MANAGEMENT_API_JWT_SECRET: TEST_JWT_SECRET_MANAGEMENT_API,
      MANAGEMENT_API_USER_INVITATION_TTL_HOURS: '0',
    });
    expect(() => validateStartupRequirements()).toThrow();
  });
});
