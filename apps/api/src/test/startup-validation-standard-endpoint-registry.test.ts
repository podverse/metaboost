import { afterEach, describe, expect, it } from 'vitest';

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

describe('startup validation Standard Endpoint registry env (api)', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('requires STANDARD_ENDPOINT_REGISTRY_URL', () => {
    withEnv({ STANDARD_ENDPOINT_REGISTRY_URL: undefined });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('rejects invalid STANDARD_ENDPOINT_REGISTRY_URL', () => {
    withEnv({ STANDARD_ENDPOINT_REGISTRY_URL: 'not-a-valid-url' });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('accepts https registry URL override', () => {
    withEnv({
      STANDARD_ENDPOINT_REGISTRY_URL:
        'https://raw.githubusercontent.com/org/repo/main/registry/apps',
    });
    expect(() => validateStartupRequirements()).not.toThrow();
  });

  it('rejects non-positive STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS when set', () => {
    withEnv({ STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS: '0' });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('rejects STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS above max when set', () => {
    withEnv({ STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS: '400000' });
    expect(() => validateStartupRequirements()).toThrow();
  });
});
