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

describe('startup validation third-party HTTP toggles (api)', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('does not require fiat/BTC provider URLs when API_EXCHANGE_RATES_FETCH_ENABLED is false', () => {
    withEnv({
      API_EXCHANGE_RATES_FETCH_ENABLED: 'false',
      API_EXCHANGE_RATES_FIAT_PROVIDER_URL: undefined,
      API_EXCHANGE_RATES_BTC_PROVIDER_URL: undefined,
    });
    expect(() => validateStartupRequirements()).not.toThrow();
  });

  it('requires fiat/BTC provider URLs when API_EXCHANGE_RATES_FETCH_ENABLED is true', () => {
    withEnv({
      API_EXCHANGE_RATES_FETCH_ENABLED: 'true',
      API_EXCHANGE_RATES_FIAT_PROVIDER_URL: undefined,
      API_EXCHANGE_RATES_BTC_PROVIDER_URL: undefined,
    });
    expect(() => validateStartupRequirements()).toThrow();
  });

  it('requires fiat/BTC provider URLs when API_EXCHANGE_RATES_FETCH_ENABLED is unset (default on)', () => {
    withEnv({
      API_EXCHANGE_RATES_FETCH_ENABLED: undefined,
      API_EXCHANGE_RATES_FIAT_PROVIDER_URL: undefined,
      API_EXCHANGE_RATES_BTC_PROVIDER_URL: undefined,
    });
    expect(() => validateStartupRequirements()).toThrow();
  });
});
