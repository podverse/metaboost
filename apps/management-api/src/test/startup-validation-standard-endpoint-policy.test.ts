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

describe('startup validation — standard endpoint policy (management-api)', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('rejects registry URL hostname outside allowlist', () => {
    withEnv({
      STANDARD_ENDPOINT_REGISTRY_URL: 'https://evil.example/registry',
    });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('allows registry hostname via STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS', () => {
    withEnv({
      STANDARD_ENDPOINT_REGISTRY_URL: 'https://mirror.internal/registry',
      STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS: 'mirror.internal',
    });
    expect(() => validateStartupRequirements()).not.toThrow();
  });

  it('rejects STANDARD_ENDPOINT_TRUST_PROXY=true with STANDARD_ENDPOINT_REQUIRE_HTTPS=false', () => {
    withEnv({
      STANDARD_ENDPOINT_TRUST_PROXY: 'true',
      STANDARD_ENDPOINT_REQUIRE_HTTPS: 'false',
    });
    expect(() => validateStartupRequirements()).toThrow();
  });
});
