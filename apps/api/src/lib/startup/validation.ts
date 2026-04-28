/**
 * API startup env validation. Delegates to @metaboost/helpers.
 * Requires DB_APP_READ_* and DB_APP_READ_WRITE_* when using database (ORM).
 * Requires API_JWT_SECRET (min length 32, must not be a weak/predictable value).
 */
import type { ValidationResult } from '@metaboost/helpers';

import {
  API_EXCHANGE_RATES_PROVIDER_DEFAULT_HOSTS,
  ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL,
  ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME,
  ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL,
  DEFAULT_METABOOST_REGISTRY_BASE_URL,
  STANDARD_ENDPOINT_REGISTRY_DEFAULT_HOSTS,
  buildHostnameAllowSet,
  hostnameAllowed,
  hostnameFromHttpUrl,
  isValidEnvBooleanToken,
  normalizedAccountSignupMode,
  normalizeBaseUrl,
  parseCommaSeparatedHostExtras,
  parseEnvBooleanToken,
  validateApiVersionPath,
  validateAccountSignupMode as validateAccountSignupModeEnv,
  validateJwtSecret,
  validateHttpOrHttpsUrl,
  validateOptional,
  validatePositiveInteger,
  validatePositiveNumber,
  validateRequired,
  validateStartupRequirements as validateRequirements,
} from '@metaboost/helpers';
import { normalizeCurrencyCode } from '@metaboost/helpers-currency';

function resolveAccountSignupMode(): string | undefined {
  return normalizedAccountSignupMode(process.env.ACCOUNT_SIGNUP_MODE);
}

function accountSignupModeUsesEmailFlows(accountSignupMode: string | undefined): boolean {
  return (
    accountSignupMode === ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL ||
    accountSignupMode === ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL
  );
}

function validateOptionalUnset(name: string, category: string): ValidationResult {
  const value = process.env[name];
  const isSet = value !== undefined && value !== null && value !== '';
  return {
    name,
    isSet,
    isValid: !isSet,
    isRequired: false,
    message: isSet
      ? `Set unexpectedly for ACCOUNT_SIGNUP_MODE=${ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME}; unset ${name}`
      : 'Not set',
    category,
  };
}

/**
 * SMTP AUTH: both MAILER_USER and MAILER_PASSWORD must be non-empty, or both empty (open relay / Mailpit).
 */
function validateMailerSmtpAuthPair(): ValidationResult {
  const userRaw = process.env.MAILER_USER;
  const passRaw = process.env.MAILER_PASSWORD;
  const userSet = userRaw !== undefined && userRaw !== null && userRaw.trim() !== '';
  const passSet = passRaw !== undefined && passRaw !== null && passRaw.trim() !== '';
  if (userSet === passSet) {
    return {
      name: 'MAILER_SMTP_AUTH',
      isSet: userSet,
      isValid: true,
      isRequired: false,
      message: userSet
        ? 'MAILER_USER and MAILER_PASSWORD both set (SMTP authentication)'
        : 'MAILER_USER and MAILER_PASSWORD both empty (no SMTP authentication)',
      category: 'Mailer',
    };
  }
  return {
    name: 'MAILER_SMTP_AUTH',
    isSet: true,
    isValid: false,
    isRequired: true,
    message:
      'Set both MAILER_USER and MAILER_PASSWORD for SMTP authentication, or leave both empty (e.g. Mailpit). One is set without the other.',
    category: 'Mailer',
  };
}

function validateAccountSignupMode(): ValidationResult {
  return validateAccountSignupModeEnv('ACCOUNT_SIGNUP_MODE', 'Auth');
}

function validateOptionalApiVersionPath(): ValidationResult {
  const value = process.env.API_VERSION_PATH;
  if (value === undefined || value === null || value.trim() === '') {
    return validateOptional('API_VERSION_PATH', 'API');
  }
  return validateApiVersionPath('API_VERSION_PATH', 'API');
}

function validateOptionalPositiveInteger(varName: string, category: string): ValidationResult {
  const value = process.env[varName];
  if (value === undefined || value === null || value.trim() === '') {
    return validateOptional(varName, category);
  }
  return validatePositiveInteger(varName, category);
}

function validateOptionalSupportedCurrency(varName: string, category: string): ValidationResult {
  const value = process.env[varName];
  if (value === undefined || value === null || value.trim() === '') {
    return validateOptional(varName, category);
  }
  const normalized = normalizeCurrencyCode(value);
  return {
    name: varName,
    isSet: true,
    isValid: normalized !== null,
    isRequired: false,
    message:
      normalized !== null
        ? `Valid supported currency: ${normalized}`
        : `Invalid currency code: "${value.trim()}"`,
    category,
  };
}

function validateOptionalPositiveNumber(
  varName: string,
  category: string,
  min: number,
  max?: number
): ValidationResult {
  const value = process.env[varName];
  if (value === undefined || value === null || value.trim() === '') {
    return validateOptional(varName, category);
  }
  return validatePositiveNumber(varName, category, true, min, max);
}

/** Optional boolean: unset/empty ok; otherwise true/false/1/0/yes/no (case-insensitive). */
/** When exchange-rate fetches are enabled (default on when unset), fiat/BTC provider URLs are required. */
function validateExchangeRatesProviderUrlsWhenFetchEnabled(): ValidationResult[] {
  const raw = process.env.API_EXCHANGE_RATES_FETCH_ENABLED;
  let enabled: boolean;
  if (raw === undefined || raw.trim() === '') {
    enabled = true;
  } else {
    enabled = parseEnvBooleanToken(raw) === true;
  }
  if (!enabled) {
    return [];
  }
  return [
    validateRequired('API_EXCHANGE_RATES_FIAT_PROVIDER_URL', 'API'),
    validateRequired('API_EXCHANGE_RATES_BTC_PROVIDER_URL', 'API'),
  ];
}

function validateOptionalBooleanish(varName: string, category: string): ValidationResult {
  const raw = process.env[varName];
  if (raw === undefined || raw === null || raw.trim() === '') {
    return validateOptional(varName, category);
  }
  const valid = isValidEnvBooleanToken(raw);
  return {
    name: varName,
    isSet: true,
    isValid: valid,
    isRequired: false,
    message: valid
      ? `Valid boolean: ${raw.trim()}`
      : `Invalid value: expected true, false, 1, 0, yes, or no; got "${raw.trim()}"`,
    category,
  };
}

/**
 * Registry `STANDARD_ENDPOINT_REGISTRY_URL` must use a host in the allowlist (GitHub by default);
 * optional `STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS` for self-hosted mirrors.
 */
export function validateStandardEndpointRegistryHostAllowlist(): ValidationResult {
  const raw = process.env.STANDARD_ENDPOINT_REGISTRY_URL;
  const effective = normalizeBaseUrl(
    raw === undefined || raw.trim() === '' ? DEFAULT_METABOOST_REGISTRY_BASE_URL : raw.trim()
  );
  const host = hostnameFromHttpUrl(effective);
  const extras = parseCommaSeparatedHostExtras(process.env.STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS);
  const allow = buildHostnameAllowSet(STANDARD_ENDPOINT_REGISTRY_DEFAULT_HOSTS, extras);
  if (host === null || !hostnameAllowed(host, allow)) {
    return {
      name: 'STANDARD_ENDPOINT_REGISTRY_URL',
      isSet: raw !== undefined && raw.trim() !== '',
      isValid: false,
      isRequired: false,
      message: `Registry URL hostname is not in the allowlist. Defaults: ${[...STANDARD_ENDPOINT_REGISTRY_DEFAULT_HOSTS].join(', ')}. Set STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS to a comma-separated list to allow additional hosts (e.g. a self-hosted registry mirror).`,
      category: 'Standard Endpoint',
    };
  }
  return {
    name: 'STANDARD_ENDPOINT_REGISTRY_URL',
    isSet: true,
    isValid: true,
    isRequired: false,
    message: `Registry host allowlist ok (${host})`,
    category: 'Standard Endpoint',
  };
}

/**
 * When exchange fetches are enabled, Frankfurter + CoinGecko hostnames are required unless
 * `API_EXCHANGE_RATES_EXTRA_HOSTS` extends the allowlist.
 */
export function validateExchangeRatesProviderHostAllowlists(): ValidationResult[] {
  const raw = process.env.API_EXCHANGE_RATES_FETCH_ENABLED;
  let enabled = true;
  if (raw !== undefined && raw.trim() !== '') {
    enabled = parseEnvBooleanToken(raw) === true;
  }
  if (!enabled) {
    return [];
  }
  const fiatUrl = (process.env.API_EXCHANGE_RATES_FIAT_PROVIDER_URL ?? '').trim();
  const btcUrl = (process.env.API_EXCHANGE_RATES_BTC_PROVIDER_URL ?? '').trim();
  const extras = parseCommaSeparatedHostExtras(process.env.API_EXCHANGE_RATES_EXTRA_HOSTS);
  const allow = buildHostnameAllowSet(API_EXCHANGE_RATES_PROVIDER_DEFAULT_HOSTS, extras);
  const out: ValidationResult[] = [];
  for (const [name, urlStr] of [
    ['API_EXCHANGE_RATES_FIAT_PROVIDER_URL', fiatUrl],
    ['API_EXCHANGE_RATES_BTC_PROVIDER_URL', btcUrl],
  ] as const) {
    const host = hostnameFromHttpUrl(urlStr);
    if (host === null || !hostnameAllowed(host, allow)) {
      out.push({
        name,
        isSet: urlStr !== '',
        isValid: false,
        isRequired: true,
        message: `Exchange provider hostname must match the allowlist defaults (${[...API_EXCHANGE_RATES_PROVIDER_DEFAULT_HOSTS].join(', ')}). Set API_EXCHANGE_RATES_EXTRA_HOSTS to a comma-separated list for additional hosts.`,
        category: 'API',
      });
    } else {
      out.push({
        name,
        isSet: urlStr !== '',
        isValid: true,
        isRequired: true,
        message: `Outbound exchange host ok (${host})`,
        category: 'API',
      });
    }
  }
  return out;
}

/** Do not combine trust-proxy with explicit HTTPS enforcement off — unsafe with X-Forwarded-Proto. */
export function validateStandardEndpointTrustProxyTopology(): ValidationResult {
  const trustRaw = process.env.STANDARD_ENDPOINT_TRUST_PROXY?.trim();
  const requireRaw = process.env.STANDARD_ENDPOINT_REQUIRE_HTTPS?.trim();
  if (trustRaw === undefined || trustRaw === '') {
    return validateOptional('STANDARD_ENDPOINT_TRUST_PROXY', 'Standard Endpoint');
  }
  const trustParsed = parseEnvBooleanToken(trustRaw);
  const requireParsed =
    requireRaw !== undefined && requireRaw !== '' ? parseEnvBooleanToken(requireRaw) : null;
  if (trustParsed === true && requireParsed === false) {
    return {
      name: 'STANDARD_ENDPOINT_TRUST_PROXY',
      isSet: true,
      isValid: false,
      isRequired: true,
      message:
        'Unsafe combination: STANDARD_ENDPOINT_TRUST_PROXY=true with STANDARD_ENDPOINT_REQUIRE_HTTPS=false would allow treating cleartext requests as HTTPS when clients send X-Forwarded-Proto. Keep HTTPS enforcement enabled when trusting proxy headers.',
      category: 'Standard Endpoint',
    };
  }
  return validateOptionalBooleanish('STANDARD_ENDPOINT_TRUST_PROXY', 'Standard Endpoint');
}

const USER_AGENT_PATTERN = /^[^/]+\/[^/]+\/[^/]+$/;

/**
 * Validates API_USER_AGENT. Format: BrandName Bot Environment/AppName/Version, e.g. "metaboost-web Bot Local/API/1"
 */
function validateUserAgent(): ValidationResult {
  const raw = process.env.API_USER_AGENT;
  const trimmed = raw?.trim() ?? '';
  const isSet = trimmed !== '';

  if (!isSet) {
    return {
      name: 'API_USER_AGENT',
      isSet: false,
      isValid: false,
      isRequired: true,
      message:
        'API_USER_AGENT is required (set in classification / env; three slash-separated segments, first segment must contain "Bot")',
      category: 'Auth & Security',
    };
  }

  if (!USER_AGENT_PATTERN.test(trimmed)) {
    return {
      name: 'API_USER_AGENT',
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid format: "${trimmed}" - must follow format: BrandName Bot Environment/AppName/Version`,
      category: 'Auth & Security',
    };
  }

  const firstPart = trimmed.split('/')[0];
  if (firstPart && !firstPart.includes('Bot')) {
    return {
      name: 'API_USER_AGENT',
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Missing "Bot" in first part: "${trimmed}"`,
      category: 'Auth & Security',
    };
  }

  return {
    name: 'API_USER_AGENT',
    isSet: true,
    isValid: true,
    isRequired: true,
    message: 'Valid format',
    category: 'Auth & Security',
  };
}

function apiValidationResults(): ValidationResult[] {
  const results: ValidationResult[] = [
    validateAccountSignupMode(),
    validatePositiveInteger('API_PORT', 'API'),
    validateOptionalApiVersionPath(),
    validateUserAgent(),
    validateJwtSecret('API_JWT_SECRET', 'API'),
    validateRequired('API_MESSAGES_TERMS_OF_SERVICE_URL', 'API'),
    validateOptionalBooleanish('API_EXCHANGE_RATES_FETCH_ENABLED', 'API'),
    validateOptionalBooleanish('API_RSS_FEED_FETCH_ENABLED', 'API'),
    validateRequired('API_EXCHANGE_RATES_FIAT_BASE_CURRENCY', 'API'),
    ...validateExchangeRatesProviderUrlsWhenFetchEnabled(),
    ...validateExchangeRatesProviderHostAllowlists(),
    validatePositiveInteger('API_EXCHANGE_RATES_CACHE_TTL_MS', 'API'),
    validateOptionalPositiveInteger('API_EXCHANGE_RATES_MAX_STALE_MS', 'API'),
    validateOptionalSupportedCurrency('API_EXCHANGE_RATES_SERVER_STANDARD_CURRENCY', 'API'),
    validateOptionalPositiveInteger('RSS_PARSE_MIN_INTERVAL_MS', 'API'),
    validateHttpOrHttpsUrl('STANDARD_ENDPOINT_REGISTRY_URL', 'Standard Endpoint'),
    validateStandardEndpointRegistryHostAllowlist(),
    validateOptionalPositiveNumber(
      'STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS',
      'Standard Endpoint',
      1,
      86_400
    ),
    validateOptionalPositiveNumber(
      'STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS',
      'Standard Endpoint',
      1,
      300_000
    ),
    validateOptionalBooleanish('STANDARD_ENDPOINT_REQUIRE_HTTPS', 'Standard Endpoint'),
    validateStandardEndpointTrustProxyTopology(),
    validateOptional('API_CORS_ORIGINS', 'API'),
    validateRequired('API_SESSION_COOKIE_NAME', 'Session cookies'),
    validateRequired('API_REFRESH_COOKIE_NAME', 'Session cookies'),
    validateOptional('API_COOKIE_DOMAIN', 'Session cookies'),
    validatePositiveInteger('API_JWT_ACCESS_EXPIRY_SECONDS', 'Session cookies'),
    validatePositiveInteger('API_JWT_REFRESH_EXPIRY_SECONDS', 'Session cookies'),
    validateRequired('DB_HOST', 'Database'),
    validatePositiveInteger('DB_PORT', 'Database'),
    validateRequired('DB_APP_NAME', 'Database'),
    validateRequired('DB_APP_READ_USER', 'Database'),
    validateRequired('DB_APP_READ_PASSWORD', 'Database'),
    validateRequired('DB_APP_READ_WRITE_USER', 'Database'),
    validateRequired('DB_APP_READ_WRITE_PASSWORD', 'Database'),
    validateRequired('VALKEY_PASSWORD', 'Valkey'),
  ];
  const accountSignupMode = resolveAccountSignupMode();
  if (accountSignupModeUsesEmailFlows(accountSignupMode)) {
    results.push(
      validateRequired('WEB_BRAND_NAME', 'Mailer'),
      validateRequired('MAILER_HOST', 'Mailer'),
      validateRequired('MAILER_PORT', 'Mailer'),
      validateRequired('MAILER_FROM', 'Mailer'),
      validateRequired('WEB_BASE_URL', 'Mailer'),
      validateMailerSmtpAuthPair()
    );
  } else if (accountSignupMode === ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME) {
    // HOST/PORT/FROM may be present from shared .env; only SMTP credentials must stay unset.
    results.push(
      validateOptionalUnset('MAILER_USER', 'Mailer'),
      validateOptionalUnset('MAILER_PASSWORD', 'Mailer')
    );
  }
  return results;
}

export const validateStartupRequirements = (): void => {
  validateRequirements(apiValidationResults());
};
