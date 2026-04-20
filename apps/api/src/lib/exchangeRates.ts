import { isFinitePositive, isNonNegativeInteger } from '@metaboost/helpers';
import {
  getCurrencyDenominationSpec,
  normalizeAmountUnitForCurrency,
  normalizeCurrencyCode,
  SUPPORTED_CURRENCIES_ORDERED,
  toMajorAmountFromMinor,
  toMinorAmountHalfUp,
  type SupportedCurrency,
} from '@metaboost/helpers-currency';

import { config } from '../config/index.js';

const FIAT_BASE = config.exchangeRatesFiatBaseCurrency;
const FIAT_RATES_URL = config.exchangeRatesFiatProviderUrl;
const BTC_PRICE_URL = config.exchangeRatesBtcProviderUrl;
const CACHE_TTL_MS = config.exchangeRatesCacheTtlMs;
const MAX_STALE_MS = config.exchangeRatesMaxStaleMs;
const SERVER_STANDARD_CURRENCY = config.exchangeRatesServerStandardCurrency;

export type ExchangeRatesSnapshot = {
  fetchedAtMs: number;
  fiatRatesByBase: Map<string, number>;
  btcInBase: number;
};

let cachedRates: ExchangeRatesSnapshot | null = null;
let inflightRatesPromise: Promise<ExchangeRatesSnapshot> | null = null;

type FrankfurterResponse = {
  rates?: Record<string, number>;
};

type CoinGeckoResponse = {
  bitcoin?: Record<string, number | undefined>;
};

async function fetchFiatRatesByBase(): Promise<Map<string, number>> {
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

function buildBtcPriceUrlForFiatBase(): string {
  const quoteCurrency = FIAT_BASE.toLowerCase();
  try {
    const url = new URL(BTC_PRICE_URL);
    // CoinGecko simple/price supports this query key.
    url.searchParams.set('vs_currencies', quoteCurrency);
    return url.toString();
  } catch {
    return BTC_PRICE_URL;
  }
}

async function fetchBtcInFiatBase(): Promise<number> {
  const quoteCurrency = FIAT_BASE.toLowerCase();
  const res = await fetch(buildBtcPriceUrlForFiatBase());
  if (!res.ok) {
    throw new Error(`btc price request failed with status ${res.status}`);
  }
  const data = (await res.json()) as CoinGeckoResponse;
  const btcInBase = data.bitcoin?.[quoteCurrency];
  if (typeof btcInBase !== 'number' || !isFinitePositive(btcInBase)) {
    throw new Error(`btc price response missing bitcoin.${quoteCurrency}`);
  }
  return btcInBase;
}

async function fetchRatesFresh(): Promise<ExchangeRatesSnapshot> {
  const [fiatRatesByBase, btcInBase] = await Promise.all([
    fetchFiatRatesByBase(),
    fetchBtcInFiatBase(),
  ]);
  return {
    fetchedAtMs: Date.now(),
    fiatRatesByBase,
    btcInBase,
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
      if (cachedRates !== null && now - cachedRates.fetchedAtMs <= MAX_STALE_MS) {
        return cachedRates;
      }
      throw new Error('exchange rates unavailable and cache is stale', { cause: error });
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
  if (preferred !== null && getSupportedBaselineCurrencies(rates).includes(preferred)) {
    return preferred;
  }
  return SERVER_STANDARD_CURRENCY;
}

export function getSupportedBaselineCurrencies(rates: ExchangeRatesSnapshot): string[] {
  return SUPPORTED_CURRENCIES_ORDERED.filter((code) => {
    if (code === 'BTC') {
      return isFinitePositive(rates.btcInBase);
    }
    return rates.fiatRatesByBase.has(code);
  });
}

function convertMajorToBaseCurrency(
  amountMajor: number,
  currency: SupportedCurrency,
  rates: ExchangeRatesSnapshot
): number | null {
  if (!Number.isFinite(amountMajor)) {
    return null;
  }
  if (currency === 'BTC') {
    if (!isFinitePositive(rates.btcInBase)) {
      return null;
    }
    return amountMajor * rates.btcInBase;
  }
  if (currency === FIAT_BASE) {
    return amountMajor;
  }
  const rate = rates.fiatRatesByBase.get(currency);
  if (rate === undefined || !isFinitePositive(rate)) {
    return null;
  }
  return amountMajor / rate;
}

function convertMajorFromBaseCurrency(
  amountInBase: number,
  targetCurrency: SupportedCurrency,
  rates: ExchangeRatesSnapshot
): number | null {
  if (!Number.isFinite(amountInBase)) {
    return null;
  }
  if (targetCurrency === 'BTC') {
    if (!isFinitePositive(rates.btcInBase)) {
      return null;
    }
    return amountInBase / rates.btcInBase;
  }
  if (targetCurrency === FIAT_BASE) {
    return amountInBase;
  }
  const targetRate = rates.fiatRatesByBase.get(targetCurrency);
  if (targetRate === undefined || !isFinitePositive(targetRate)) {
    return null;
  }
  return amountInBase * targetRate;
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
  if (!isNonNegativeInteger(params.amount)) {
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
  const inputSpec = getCurrencyDenominationSpec(inputCurrency);
  const baselineSpec = getCurrencyDenominationSpec(baseline);
  if (inputSpec === null || baselineSpec === null) {
    return null;
  }
  try {
    normalizeAmountUnitForCurrency({
      currency: inputCurrency,
      amountUnit: params.amountUnit,
    });
  } catch {
    return null;
  }
  const inputMajor = toMajorAmountFromMinor(params.amount, inputSpec.minorUnitExponent);
  const baseMajor = convertMajorToBaseCurrency(inputMajor, inputCurrency, rates);
  if (baseMajor === null) {
    return null;
  }
  return convertMajorFromBaseCurrency(baseMajor, baseline, rates);
}

export function convertToBaselineMinorAmount(
  params: {
    amount: number;
    currency: string | null | undefined;
    amountUnit: string | null | undefined;
  },
  baselineCurrency: string,
  rates: ExchangeRatesSnapshot
): number | null {
  const baseline = normalizeCurrencyCode(baselineCurrency);
  if (baseline === null) {
    return null;
  }
  const baselineSpec = getCurrencyDenominationSpec(baseline);
  if (baselineSpec === null) {
    return null;
  }
  const baselineMajorAmount = convertToBaselineAmount(params, baselineCurrency, rates);
  if (baselineMajorAmount === null) {
    return null;
  }
  return toMinorAmountHalfUp(baselineMajorAmount, baselineSpec.minorUnitExponent);
}
