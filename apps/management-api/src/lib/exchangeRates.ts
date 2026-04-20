import { isFinitePositive, isNonNegativeInteger, parseEnvBooleanToken } from '@metaboost/helpers';
import {
  getCurrencyDenominationSpec,
  normalizeAmountUnitForCurrency,
  normalizeCurrencyCode,
  toMajorAmountFromMinor,
  toMinorAmountHalfUp,
  type SupportedCurrency,
} from '@metaboost/helpers-currency';

function isExchangeRatesFetchEnabled(): boolean {
  const raw = process.env.API_EXCHANGE_RATES_FETCH_ENABLED;
  if (raw === undefined || raw.trim() === '') {
    return false;
  }
  return parseEnvBooleanToken(raw) === true;
}

/** Thrown when outbound Frankfurter/CoinGecko fetches are disabled for this service. */
export class ExchangeRatesFetchDisabledError extends Error {
  constructor() {
    super(
      'Exchange rate fetches are disabled (set API_EXCHANGE_RATES_FETCH_ENABLED=true). Threshold snapshot recomputation needs outbound HTTPS to rate providers.'
    );
    this.name = 'ExchangeRatesFetchDisabledError';
  }
}

export type ExchangeRatesSnapshot = {
  fetchedAtMs: number;
  fiatRatesByBase: Map<string, number>;
  btcInBase: number;
};

type FrankfurterResponse = {
  rates?: Record<string, number>;
};

type CoinGeckoResponse = {
  bitcoin?: Record<string, number | undefined>;
};

const FIAT_BASE = normalizeCurrencyCode(process.env.API_EXCHANGE_RATES_FIAT_BASE_CURRENCY) ?? 'USD';
const FIAT_RATES_URL =
  process.env.API_EXCHANGE_RATES_FIAT_PROVIDER_URL ??
  `https://api.frankfurter.app/latest?base=${FIAT_BASE}`;
const BTC_PRICE_URL =
  process.env.API_EXCHANGE_RATES_BTC_PROVIDER_URL ??
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin';
const CACHE_TTL_MS = Number.parseInt(process.env.API_EXCHANGE_RATES_CACHE_TTL_MS ?? '300000', 10);
const MAX_STALE_MS = Number.parseInt(
  process.env.API_EXCHANGE_RATES_MAX_STALE_MS ?? String(CACHE_TTL_MS * 3),
  10
);

let cachedRates: ExchangeRatesSnapshot | null = null;
let inflightRatesPromise: Promise<ExchangeRatesSnapshot> | null = null;

function buildBtcPriceUrlForFiatBase(): string {
  const quoteCurrency = FIAT_BASE.toLowerCase();
  try {
    const url = new URL(BTC_PRICE_URL);
    url.searchParams.set('vs_currencies', quoteCurrency);
    return url.toString();
  } catch {
    return BTC_PRICE_URL;
  }
}

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
  if (!isExchangeRatesFetchEnabled()) {
    throw new ExchangeRatesFetchDisabledError();
  }
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

function convertToBaselineAmount(
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
  if (inputSpec === null) {
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
