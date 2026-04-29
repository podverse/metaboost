import { afterEach, describe, expect, it } from 'vitest';

import {
  validateExchangeRatesProviderHostAllowlists,
  validateStandardEndpointRegistryHostAllowlist,
  validateStandardEndpointTrustProxyTopology,
  validateStartupRequirements,
} from '../lib/startup/validation.js';

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

describe('startup validation — standard endpoint dependency policy (api)', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('exported validators', () => {
    it('registry host allowlist rejects arbitrary host without extras', () => {
      withEnv({
        STANDARD_ENDPOINT_REGISTRY_URL: 'https://evil.example/registry',
      });
      expect(validateStandardEndpointRegistryHostAllowlist().isValid).toBe(false);
    });

    it('registry host allowlist accepts default GitHub raw registry host', () => {
      withEnv({
        STANDARD_ENDPOINT_REGISTRY_URL:
          'https://raw.githubusercontent.com/v4v-io/metaboost-registry/main/registry/apps',
      });
      expect(validateStandardEndpointRegistryHostAllowlist().isValid).toBe(true);
    });

    it('registry host allowlist accepts extra host via STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS', () => {
      withEnv({
        STANDARD_ENDPOINT_REGISTRY_URL: 'https://mirror.internal/registry',
        STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS: 'mirror.internal',
      });
      expect(validateStandardEndpointRegistryHostAllowlist().isValid).toBe(true);
    });

    it('trust proxy topology rejects trust=true with explicit require https=false', () => {
      withEnv({
        STANDARD_ENDPOINT_TRUST_PROXY: 'true',
        STANDARD_ENDPOINT_REQUIRE_HTTPS: 'false',
      });
      expect(validateStandardEndpointTrustProxyTopology().isValid).toBe(false);
    });

    it('exchange provider hosts reject unknown fiat host when fetch enabled', () => {
      withEnv({
        API_EXCHANGE_RATES_FETCH_ENABLED: 'true',
        API_EXCHANGE_RATES_FIAT_PROVIDER_URL: 'https://rates.evil.example/latest',
        API_EXCHANGE_RATES_BTC_PROVIDER_URL:
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      });
      const results = validateExchangeRatesProviderHostAllowlists();
      expect(results.some((r) => !r.isValid)).toBe(true);
    });

    it('exchange provider hosts allow extra host via API_EXCHANGE_RATES_EXTRA_HOSTS', () => {
      withEnv({
        API_EXCHANGE_RATES_FETCH_ENABLED: 'true',
        API_EXCHANGE_RATES_FIAT_PROVIDER_URL: 'https://rates.evil.example/latest',
        API_EXCHANGE_RATES_BTC_PROVIDER_URL:
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        API_EXCHANGE_RATES_EXTRA_HOSTS: 'rates.evil.example',
      });
      const results = validateExchangeRatesProviderHostAllowlists();
      expect(results.every((r) => r.isValid)).toBe(true);
    });

    it('skips exchange provider host allowlist checks when provider URLs are missing', () => {
      withEnv({
        API_EXCHANGE_RATES_FETCH_ENABLED: 'true',
        API_EXCHANGE_RATES_FIAT_PROVIDER_URL: undefined,
        API_EXCHANGE_RATES_BTC_PROVIDER_URL: undefined,
      });
      const results = validateExchangeRatesProviderHostAllowlists();
      expect(results).toEqual([]);
    });
  });

  describe('full startup validation', () => {
    it('rejects unsafe trust proxy + explicit require https=false combo', () => {
      withEnv({
        STANDARD_ENDPOINT_TRUST_PROXY: 'true',
        STANDARD_ENDPOINT_REQUIRE_HTTPS: 'false',
      });
      expect(() => validateStartupRequirements()).toThrow();
    });
  });
});
