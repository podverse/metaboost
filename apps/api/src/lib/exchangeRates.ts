import { config } from '../config/index.js';

const FIAT_BASE = config.exchangeRatesFiatBaseCurrency;
const FIAT_RATES_URL = config.exchangeRatesFiatProviderUrl;
const BTC_PRICE_URL = config.exchangeRatesBtcProviderUrl;
const CACHE_TTL_MS = config.exchangeRatesCacheTtlMs;

export type ExchangeRatesSnapshot = {
  fetchedAtMs: number;
  fiatRatesByUsd: Map<string, number>;
  btcUsd: number;
};

let cachedRates: ExchangeRatesSnapshot | null = null;
let inflightRatesPromise: Promise<ExchangeRatesSnapshot> | null = null;

const SATOSHIS_PER_BTC = 100_000_000;

type FrankfurterResponse = {
  rates?: Record<string, number>;
};

type CoinGeckoResponse = {
  bitcoin?: {
    usd?: number;
  };
};

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function normalizeCurrencyCode(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().toUpperCase();
  return trimmed === '' ? null : trimmed;
}

async function fetchFiatRatesByUsd(): Promise<Map<string, number>> {
  const res = await fetch(FIAT_RATES_URL);
  if (!res.ok) {
    throw new Error(`fiat rates request failed with status ${res.status}`);
  }
  const data = (await res.json()) as FrankfurterResponse;
  const rates = new Map<string, number>();
  rates.set(FIAT_BASE, 1);
  const source = data.rates ?? {};
  for (const [codeRaw, value] of Object.entries(source)) {
    const code = normalizeCurrencyCode(codeRaw);
    if (code === null || typeof value !== 'number' || !isFinitePositive(value)) {
      continue;
    }
    rates.set(code, value);
  }
  return rates;
}

async function fetchBtcUsd(): Promise<number> {
  const res = await fetch(BTC_PRICE_URL);
  if (!res.ok) {
    throw new Error(`btc price request failed with status ${res.status}`);
  }
  const data = (await res.json()) as CoinGeckoResponse;
  const usd = data.bitcoin?.usd;
  if (typeof usd !== 'number' || !isFinitePositive(usd)) {
    throw new Error('btc price response missing bitcoin.usd');
  }
  return usd;
}

async function fetchRatesFresh(): Promise<ExchangeRatesSnapshot> {
  const [fiatRatesByUsd, btcUsd] = await Promise.all([fetchFiatRatesByUsd(), fetchBtcUsd()]);
  return {
    fetchedAtMs: Date.now(),
    fiatRatesByUsd,
    btcUsd,
  };
}

export async function getExchangeRates(): Promise<ExchangeRatesSnapshot> {
  const now = Date.now();
  if (cachedRates !== null && now - cachedRates.fetchedAtMs < CACHE_TTL_MS) {
    return cachedRates;
  }
  if (inflightRatesPromise !== null) {
    return inflightRatesPromise;
  }
  inflightRatesPromise = (async () => {
    try {
      const fresh = await fetchRatesFresh();
      cachedRates = fresh;
      return fresh;
    } catch (error) {
      if (cachedRates !== null) {
        return cachedRates;
      }
      throw error;
    } finally {
      inflightRatesPromise = null;
    }
  })();
  return inflightRatesPromise;
}

export function resolveEffectiveBaselineCurrency(
  preferredCurrency: string | null | undefined,
  rates: ExchangeRatesSnapshot
): string {
  const preferred = normalizeCurrencyCode(preferredCurrency);
  if (preferred === 'BTC') {
    return 'BTC';
  }
  if (preferred !== null && rates.fiatRatesByUsd.has(preferred)) {
    return preferred;
  }
  return FIAT_BASE;
}

export function getSupportedBaselineCurrencies(rates: ExchangeRatesSnapshot): string[] {
  const fiat = [...rates.fiatRatesByUsd.keys()].sort((a, b) => a.localeCompare(b));
  return ['BTC', ...fiat];
}

export function convertToBaselineAmount(
  params: {
    amount: number;
    currency: string | null | undefined;
    amountUnit: string | null | undefined;
  },
  baselineCurrency: string,
  rates: ExchangeRatesSnapshot
): number | null {
  if (!Number.isFinite(params.amount)) {
    return null;
  }
  const inputCurrency = normalizeCurrencyCode(params.currency);
  if (inputCurrency === null) {
    return null;
  }
  const baseline = normalizeCurrencyCode(baselineCurrency);
  if (baseline === null) {
    return null;
  }

  let inputAmountInUsd: number;

  if (inputCurrency === 'BTC') {
    const unit = normalizeCurrencyCode(params.amountUnit);
    const amountBtc =
      unit === 'SATOSHI' || unit === 'SATOSHIS' ? params.amount / SATOSHIS_PER_BTC : params.amount;
    inputAmountInUsd = amountBtc * rates.btcUsd;
  } else {
    const perUsd = rates.fiatRatesByUsd.get(inputCurrency);
    if (perUsd === undefined || !isFinitePositive(perUsd)) {
      return null;
    }
    inputAmountInUsd = params.amount / perUsd;
  }

  if (!Number.isFinite(inputAmountInUsd)) {
    return null;
  }

  if (baseline === 'BTC') {
    if (!isFinitePositive(rates.btcUsd)) {
      return null;
    }
    return inputAmountInUsd / rates.btcUsd;
  }

  const baselinePerUsd = rates.fiatRatesByUsd.get(baseline);
  if (baselinePerUsd === undefined || !isFinitePositive(baselinePerUsd)) {
    return null;
  }
  return inputAmountInUsd * baselinePerUsd;
}
