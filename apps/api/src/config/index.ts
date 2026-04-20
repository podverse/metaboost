import type {
  AuthModeCapabilities as SharedAuthModeCapabilities,
  AuthModeValue,
} from '@metaboost/helpers';

import {
  getAuthModeCapabilities as getSharedAuthModeCapabilities,
  normalizeVersionPath,
  parseAuthModeOrThrow,
  parseCorsOrigins,
  parseEnvBooleanToken,
} from '@metaboost/helpers';
import { normalizeCurrencyCode } from '@metaboost/helpers-currency';

import {
  buildAppRegistryRecordUrl,
  resolveStandardEndpointRegistryFromEnv,
} from './standardEndpointRegistry.js';

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

const getEnvOptional = (key: string): string | undefined =>
  process.env[key] === undefined || process.env[key] === '' ? undefined : process.env[key];

const getEnvOptionalTrimmed = (key: string): string | undefined => {
  const v = getEnvOptional(key);
  if (v === undefined) {
    return undefined;
  }
  const t = v.trim();
  return t === '' ? undefined : t;
};

export type AuthMode = AuthModeValue;
export type AuthModeCapabilities = SharedAuthModeCapabilities;

const parseAuthMode = (value: string): AuthMode => parseAuthModeOrThrow(value);

export const getAuthModeCapabilities = (authMode: AuthMode): AuthModeCapabilities => {
  return getSharedAuthModeCapabilities(authMode);
};

/** Signup (POST /auth/signup) is enabled only when AUTH_MODE=user_signup_email. */
export const isSignupEnabled = (): boolean => {
  const authMode = parseAuthMode(getEnv('AUTH_MODE'));
  return getAuthModeCapabilities(authMode).canPublicSignup;
};

const authMode = parseAuthMode(getEnv('AUTH_MODE'));
const authModeCapabilities = getAuthModeCapabilities(authMode);

/**
 * Opt-in third-party HTTP (default off). Unset/false ⇒ disabled. When set, must be a valid env boolean token.
 * See API_EXCHANGE_RATES_FETCH_ENABLED, API_RSS_FEED_FETCH_ENABLED in classification.
 */
function resolveThirdPartyOptIn(envKey: string): boolean {
  const raw = process.env[envKey];
  if (raw === undefined || raw.trim() === '') {
    return false;
  }
  const parsed = parseEnvBooleanToken(raw);
  if (parsed === null) {
    throw new Error(`${envKey} must be true/false/1/0/yes/no when set`);
  }
  return parsed;
}

const exchangeRatesFetchEnabled = resolveThirdPartyOptIn('API_EXCHANGE_RATES_FETCH_ENABLED');
const rssFeedFetchEnabled = resolveThirdPartyOptIn('API_RSS_FEED_FETCH_ENABLED');

const standardEndpointRegistry = resolveStandardEndpointRegistryFromEnv(getEnvOptional);
const exchangeRatesFiatBaseCurrency = getEnv('API_EXCHANGE_RATES_FIAT_BASE_CURRENCY')
  .trim()
  .toUpperCase();
const exchangeRatesFiatProviderUrl = exchangeRatesFetchEnabled
  ? getEnv('API_EXCHANGE_RATES_FIAT_PROVIDER_URL').trim()
  : (getEnvOptional('API_EXCHANGE_RATES_FIAT_PROVIDER_URL') ?? '').trim();
const exchangeRatesBtcProviderUrl = exchangeRatesFetchEnabled
  ? getEnv('API_EXCHANGE_RATES_BTC_PROVIDER_URL').trim()
  : (getEnvOptional('API_EXCHANGE_RATES_BTC_PROVIDER_URL') ?? '').trim();
const exchangeRatesCacheTtlMs = Number.parseInt(getEnv('API_EXCHANGE_RATES_CACHE_TTL_MS'), 10);
const exchangeRatesMaxStaleMs = Number.parseInt(
  getEnvOptional('API_EXCHANGE_RATES_MAX_STALE_MS') ?? String(exchangeRatesCacheTtlMs * 3),
  10
);
const exchangeRatesServerStandardCurrencyRaw = (
  getEnvOptional('API_EXCHANGE_RATES_SERVER_STANDARD_CURRENCY') ?? 'USD'
)
  .trim()
  .toUpperCase();
const exchangeRatesServerStandardCurrency = normalizeCurrencyCode(
  exchangeRatesServerStandardCurrencyRaw
);
if (exchangeRatesServerStandardCurrency === null) {
  throw new Error(
    `Invalid API_EXCHANGE_RATES_SERVER_STANDARD_CURRENCY: ${exchangeRatesServerStandardCurrencyRaw}`
  );
}

export const config = {
  /** Auth mode (required at startup): admin_only_username, admin_only_email, user_signup_email. */
  authMode,
  authModeCapabilities,
  port: Number.parseInt(getEnv('API_PORT'), 10),
  /** Outbound HTTP User-Agent (required; set in classification / env). */
  userAgent: getEnv('API_USER_AGENT'),
  jwtSecret: getEnv('API_JWT_SECRET'),
  /** API version path prefix (e.g. /v1). Optional; set API_VERSION_PATH in env. */
  apiVersionPath: normalizeVersionPath(getEnvOptional('API_VERSION_PATH') ?? 'v1'),
  /**
   * Public browser-facing API origin (scheme + host + optional port), no path, no trailing slash.
   * Used to build canonical metaBoost URLs for RSS verification (must match feed tag host).
   */
  apiPublicBaseUrl: getEnv('API_PUBLIC_BASE_URL').trim().replace(/\/$/, ''),
  /** Terms URL returned to message-capability clients. Required. */
  messagesTermsOfServiceUrl: getEnv('API_MESSAGES_TERMS_OF_SERVICE_URL'),
  /** Minimum interval between RSS reparses used by mbrss-v1 ingest reparse-on-miss fallback. */
  rssParseMinIntervalMs: Number.parseInt(
    getEnvOptional('RSS_PARSE_MIN_INTERVAL_MS') ?? '600000',
    10
  ),
  /** Access token expiry in seconds (JWT and cookie max-age). Required; e.g. 900 = 15m. */
  accessTokenMaxAgeSeconds: Number.parseInt(getEnv('API_JWT_ACCESS_EXPIRY_SECONDS'), 10),
  /** Refresh token cookie max-age in seconds (e.g. 604800 = 7d). Required. */
  refreshTokenMaxAgeSeconds: Number.parseInt(getEnv('API_JWT_REFRESH_EXPIRY_SECONDS'), 10),
  /** Cookie names for session (access) and refresh. Required. */
  sessionCookieName: getEnv('API_SESSION_COOKIE_NAME'),
  refreshCookieName: getEnv('API_REFRESH_COOKIE_NAME'),
  /** CORS allowed origins. Optional; empty/missing = allow all (dev). */
  corsOrigins: parseCorsOrigins(getEnvOptional('API_CORS_ORIGINS')),
  /** Secure cookies in production. */
  cookieSecure: process.env.NODE_ENV === 'production',
  /** SameSite is fixed to `lax` (not configurable via env). */
  cookieSameSite: 'lax' as const,
  /** Optional Set-Cookie Domain (e.g. `.example.com`) for sharing session cookies across subdomains. */
  cookieDomain: getEnvOptionalTrimmed('API_COOKIE_DOMAIN'),

  /**
   * Base URL for app registry JSON (no trailing slash). Default: Podverse `metaboost-registry` raw tree.
   * Override with `STANDARD_ENDPOINT_REGISTRY_URL`. Lookup: `<base>/<app_id>.app.json`.
   */
  standardEndpointRegistryUrl: standardEndpointRegistry.standardEndpointRegistryUrl,
  /** Poll interval for registry refresh (seconds). Default 300. Override: `STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS`. */
  standardEndpointRegistryPollSeconds: standardEndpointRegistry.standardEndpointRegistryPollSeconds,
  /** HTTP timeout when fetching registry documents (ms). Default 10000. Override: `STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS`. */
  standardEndpointRegistryTimeoutMs: standardEndpointRegistry.standardEndpointRegistryTimeoutMs,
  /** Fiat base currency for exchange-rate map seeding. Required env. */
  exchangeRatesFiatBaseCurrency,
  /** Fiat provider endpoint URL. Required env. */
  exchangeRatesFiatProviderUrl,
  /** BTC pricing endpoint URL. Required env. */
  exchangeRatesBtcProviderUrl,
  /** In-memory exchange-rate cache TTL in milliseconds. Required env. */
  exchangeRatesCacheTtlMs,
  /** Maximum allowed age for stale cache fallback in milliseconds. Optional. */
  exchangeRatesMaxStaleMs,
  /** Server-wide standard currency fallback used for baseline conversions. Optional, defaults to USD. */
  exchangeRatesServerStandardCurrency,
  /**
   * When true, allow HTTPS to Frankfurter + CoinGecko (`API_EXCHANGE_RATES_*_PROVIDER_URL`). When false: no outbound rate calls
   * (GET /exchange-rates, bucket conversion, dashboard summaries, boost threshold snapshots unavailable).
   */
  exchangeRatesFetchEnabled,
  /**
   * When true, allow HTTPS to user-supplied RSS feed URLs for MBRSS verify/sync and RSS bucket types.
   * When false: only MetaBoost custom buckets (mb-root / mb-mid / mb-leaf) may be created; RSS feed fetch is blocked.
   */
  rssFeedFetchEnabled,
};

export { buildAppRegistryRecordUrl, resolveStandardEndpointRegistryFromEnv };
