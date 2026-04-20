import { afterEach, describe, expect, it, vi } from 'vitest';

type EnvSnapshot = Record<string, string | undefined>;

const EXCHANGE_RATE_ENV_KEYS = [
  'API_EXCHANGE_RATES_FIAT_BASE_CURRENCY',
  'API_EXCHANGE_RATES_FIAT_PROVIDER_URL',
  'API_EXCHANGE_RATES_BTC_PROVIDER_URL',
  'API_EXCHANGE_RATES_CACHE_TTL_MS',
  'API_EXCHANGE_RATES_MAX_STALE_MS',
] as const;

function snapshotExchangeRateEnv(): EnvSnapshot {
  const snapshot: EnvSnapshot = {};
  for (const key of EXCHANGE_RATE_ENV_KEYS) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreExchangeRateEnv(snapshot: EnvSnapshot): void {
  for (const key of EXCHANGE_RATE_ENV_KEYS) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('exchange-rates service with non-USD fiat base', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports EUR fiat base while converting BTC to USD baseline correctly', async () => {
    const envSnapshot = snapshotExchangeRateEnv();
    try {
      process.env.API_EXCHANGE_RATES_FIAT_BASE_CURRENCY = 'EUR';
      process.env.API_EXCHANGE_RATES_FIAT_PROVIDER_URL =
        'https://api.frankfurter.app/latest?from=EUR';
      process.env.API_EXCHANGE_RATES_BTC_PROVIDER_URL =
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur';
      process.env.API_EXCHANGE_RATES_CACHE_TTL_MS = '600000';
      process.env.API_EXCHANGE_RATES_MAX_STALE_MS = '1800000';

      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string | URL | Request) => {
          const url =
            typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          if (url.includes('frankfurter.app')) {
            return new Response(JSON.stringify({ rates: { USD: 1.2, GBP: 0.86 } }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }
          if (url.includes('coingecko.com')) {
            return new Response(JSON.stringify({ bitcoin: { eur: 90_000 } }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }
          return new Response('Not Found', { status: 404 });
        })
      );

      const modulePath = `../lib/exchangeRates.js?nonce=${Date.now()}`;
      const exchangeRatesModule = await import(modulePath);
      const rates = await exchangeRatesModule.getExchangeRates();
      const convertedUsdMinor = exchangeRatesModule.convertToBaselineMinorAmount(
        {
          amount: 100_000_000,
          currency: 'BTC',
          amountUnit: 'satoshi',
        },
        'USD',
        rates
      );

      expect(convertedUsdMinor).toBe(10_800_000);
      expect(exchangeRatesModule.getSupportedBaselineCurrencies(rates)).toEqual(
        expect.arrayContaining(['EUR', 'USD', 'BTC'])
      );
    } finally {
      restoreExchangeRateEnv(envSnapshot);
    }
  });
});
