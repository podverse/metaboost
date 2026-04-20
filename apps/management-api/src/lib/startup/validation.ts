/**
 * Management API startup env validation. Requires shared Postgres **`DB_HOST`** / **`DB_PORT`**,
 * management DB **`DB_MANAGEMENT_NAME`** and **`DB_MANAGEMENT_READ_WRITE_*`**, and main app **`DB_APP_*`**
 * for `@metaboost/orm`.
 */
import type { ValidationResult } from '@metaboost/helpers';

import {
  isValidEnvBooleanToken,
  validateApiVersionPath,
  validateAuthMode as validateAuthModeEnv,
  validateHttpOrHttpsUrl,
  validateJwtSecret,
  validateOptional,
  validatePositiveInteger,
  validateRequired,
  validateStartupRequirements as validateRequirements,
} from '@metaboost/helpers';

function validateAuthMode(): ValidationResult {
  return validateAuthModeEnv('AUTH_MODE', 'Auth');
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
        'MANAGEMENT_API_USER_AGENT is required (set in classification / env; three slash-separated segments, first segment must contain "Bot")',
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
  if (firstPart && !firstPart.includes('Bot')) {
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

function managementApiValidationResults() {
  return [
    validateAuthMode(),
    validatePositiveInteger('MANAGEMENT_API_PORT', 'Management API'),
    validateOptionalApiVersionPath(),
    validateUserAgent(),
    validateJwtSecret('MANAGEMENT_API_JWT_SECRET', 'Management API'),
    validateOptional('MANAGEMENT_API_CORS_ORIGINS', 'Management API'),
    validateRequired('MANAGEMENT_API_SESSION_COOKIE_NAME', 'Management session cookies'),
    validateRequired('MANAGEMENT_API_REFRESH_COOKIE_NAME', 'Management session cookies'),
    validateOptional('MANAGEMENT_API_COOKIE_DOMAIN', 'Management session cookies'),
    validatePositiveInteger(
      'MANAGEMENT_API_JWT_ACCESS_EXPIRY_SECONDS',
      'Management session cookies'
    ),
    validatePositiveInteger(
      'MANAGEMENT_API_JWT_REFRESH_EXPIRY_SECONDS',
      'Management session cookies'
    ),
    validatePositiveInteger('MANAGEMENT_API_USER_INVITATION_TTL_HOURS', 'Management users'),
    validateOptional('WEB_BASE_URL', 'Management users'),
    validateOptionalBooleanish('API_EXCHANGE_RATES_FETCH_ENABLED', 'API'),
    validateHttpOrHttpsUrl('STANDARD_ENDPOINT_REGISTRY_URL', 'Standard Endpoint'),
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
