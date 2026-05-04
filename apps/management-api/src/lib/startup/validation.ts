/**
 * Management API startup env validation. Requires shared Postgres **`DB_HOST`** / **`DB_PORT`**,
 * management DB **`DB_MANAGEMENT_NAME`** and **`DB_MANAGEMENT_READ_WRITE_*`**, and main app **`DB_APP_*`**
 * for `@metaboost/orm`.
 */
import type { ValidationResult } from '@metaboost/helpers';

import {
  DEFAULT_METABOOST_REGISTRY_BASE_URL,
  STANDARD_ENDPOINT_REGISTRY_DEFAULT_HOSTS,
  buildHostnameAllowSet,
  hostnameAllowed,
  hostnameFromHttpUrl,
  isValidEnvBooleanToken,
  normalizeBaseUrl,
  parseCommaSeparatedHostExtras,
  parseEnvBooleanToken,
  validateApiVersionPath,
  validateAccountSignupMode as validateAccountSignupModeEnv,
  validateHttpOrHttpsUrl,
  validateJwtSecret,
  validateOptional,
  validatePositiveInteger,
  validateRequired,
  validateStartupRequirements as validateRequirements,
} from '@metaboost/helpers';

function validateAccountSignupMode(): ValidationResult {
  return validateAccountSignupModeEnv('ACCOUNT_SIGNUP_MODE', 'Auth');
}

function validateOptionalApiVersionPath(): ValidationResult {
  const value = process.env.MANAGEMENT_API_VERSION_PATH;
  if (value === undefined || value === null || value.trim() === '') {
    return validateOptional('MANAGEMENT_API_VERSION_PATH', 'Management API');
  }
  return validateApiVersionPath('MANAGEMENT_API_VERSION_PATH', 'Management API');
}

const USER_AGENT_PATTERN = /^[^/]+\/[^/]+\/[^/]+$/;

/**
 * Validates MANAGEMENT_API_USER_AGENT. Format: BrandName Bot Environment/AppName/Version, e.g. "metaboost-management-api Bot Local/Management-API/1"
 */
function validateUserAgent(): ValidationResult {
  const raw = process.env.MANAGEMENT_API_USER_AGENT;
  const trimmed = raw?.trim() ?? '';
  const isSet = trimmed !== '';

  if (!isSet) {
    return {
      name: 'MANAGEMENT_API_USER_AGENT',
      isSet: false,
      isValid: false,
      isRequired: true,
      message:
        'MANAGEMENT_API_USER_AGENT is required (set in env templates / env; three slash-separated segments, first segment must contain "Bot")',
      category: 'Auth & Security',
    };
  }

  if (!USER_AGENT_PATTERN.test(trimmed)) {
    return {
      name: 'MANAGEMENT_API_USER_AGENT',
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid format: "${trimmed}" - must follow format: BrandName Bot Environment/AppName/Version`,
      category: 'Auth & Security',
    };
  }

  const firstPart = trimmed.split('/')[0];
  if (firstPart && !firstPart.toLowerCase().includes('bot')) {
    return {
      name: 'MANAGEMENT_API_USER_AGENT',
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Missing "Bot" in first part: "${trimmed}"`,
      category: 'Auth & Security',
    };
  }

  return {
    name: 'MANAGEMENT_API_USER_AGENT',
    isSet: true,
    isValid: true,
    isRequired: true,
    message: 'Valid format',
    category: 'Auth & Security',
  };
}

/** Optional boolean: unset/empty ok; otherwise true/false/1/0/yes/no (case-insensitive). */
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

/** Registry `STANDARD_ENDPOINT_REGISTRY_URL` must use a host in the allowlist (GitHub by default). */
function validateStandardEndpointRegistryHostAllowlist(): ValidationResult {
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

/** Do not combine trust-proxy with explicit HTTPS enforcement off — unsafe with X-Forwarded-Proto. */
function validateStandardEndpointTrustProxyTopology(): ValidationResult {
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

function managementApiValidationResults() {
  return [
    validateAccountSignupMode(),
    validatePositiveInteger('MANAGEMENT_API_PORT', 'Management API'),
    validateOptionalApiVersionPath(),
    validateRequired('MANAGEMENT_API_RELEASE', 'Management API'),
    validateUserAgent(),
    validateJwtSecret('AUTH_JWT_SECRET', 'Management API'),
    validateOptional('MANAGEMENT_API_CORS_ORIGINS', 'Management API'),
    validateRequired('MANAGEMENT_API_SESSION_COOKIE_NAME', 'Management session cookies'),
    validateRequired('MANAGEMENT_API_REFRESH_COOKIE_NAME', 'Management session cookies'),
    validateOptional('MANAGEMENT_API_COOKIE_DOMAIN', 'Management session cookies'),
    validatePositiveInteger('MANAGEMENT_API_JWT_ACCESS_EXPIRATION', 'Management session cookies'),
    validatePositiveInteger('MANAGEMENT_API_JWT_REFRESH_EXPIRATION', 'Management session cookies'),
    validatePositiveInteger('MANAGEMENT_API_USER_INVITATION_EXPIRATION', 'Management users'),
    validateOptional('WEB_BASE_URL', 'Management users'),
    validateOptionalBooleanish('API_EXCHANGE_RATES_FETCH_ENABLED', 'API'),
    validateHttpOrHttpsUrl('STANDARD_ENDPOINT_REGISTRY_URL', 'Standard Endpoint'),
    validateStandardEndpointRegistryHostAllowlist(),
    validateOptionalBooleanish('STANDARD_ENDPOINT_REQUIRE_HTTPS', 'Standard Endpoint'),
    validateStandardEndpointTrustProxyTopology(),
    validateOptionalBooleanish('MANAGEMENT_API_AUTH_RATE_LIMIT_USE_KEYVALDB', 'Management API'),
    validateRequired('DB_MANAGEMENT_NAME', 'Management DB'),
    validateRequired('DB_MANAGEMENT_READ_WRITE_USER', 'Management DB'),
    validateRequired('DB_MANAGEMENT_READ_WRITE_PASSWORD', 'Management DB'),
    validateRequired('DB_HOST', 'Main DB'),
    validatePositiveInteger('DB_PORT', 'Main DB'),
    validateRequired('DB_APP_NAME', 'Main DB'),
    validateRequired('DB_APP_READ_USER', 'Main DB'),
    validateRequired('DB_APP_READ_PASSWORD', 'Main DB'),
    validateRequired('DB_APP_READ_WRITE_USER', 'Main DB'),
    validateRequired('DB_APP_READ_WRITE_PASSWORD', 'Main DB'),
  ];
}

export const validateStartupRequirements = (): void => {
  validateRequirements(managementApiValidationResults());
};
