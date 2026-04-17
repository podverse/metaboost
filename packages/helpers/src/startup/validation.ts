/* eslint-disable no-console -- startup validation output to console */

/**
 * Shared startup environment validation. Used by API and web-sidecar.
 * Pattern aligned with Podverse monorepo (helpers-config / lib/startup/validation).
 */

import {
  AUTH_MODE_VALUES,
  isAuthModeValue,
  normalizedAuthMode,
} from '../auth/auth-mode-constants.js';
import { ALL_AVAILABLE_LOCALES, type Locale } from '../locale/constants.js';
import { normalizeVersionPath } from './version-path.js';

export type ValidationResult = {
  name: string;
  isSet: boolean;
  isValid: boolean;
  isRequired: boolean;
  message: string;
  category: string;
};

export type ValidationSummary = {
  total: number;
  passed: number;
  failed: number;
  requiredMissing: number;
  skipped: number;
  defaultsUsed: number;
  results: ValidationResult[];
};

/**
 * Validates that an env var is set and non-empty.
 */
export function validateRequired(varName: string, category: string): ValidationResult {
  const value = process.env[varName];
  const isSet =
    value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '';
  return {
    name: varName,
    isSet,
    isValid: isSet,
    isRequired: true,
    message: isSet ? 'Set' : 'Missing or empty',
    category,
  };
}

/**
 * Validates that an env var is set and a positive integer (e.g. API_PORT, PORT).
 */
export function validatePositiveInteger(varName: string, category: string): ValidationResult {
  const value = process.env[varName];
  const isSet =
    value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '';
  if (!isSet) {
    return {
      name: varName,
      isSet: false,
      isValid: false,
      isRequired: true,
      message: 'Missing - must be a positive integer',
      category,
    };
  }
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num) || num <= 0) {
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid: "${value}" - must be a positive integer`,
      category,
    };
  }
  return {
    name: varName,
    isSet: true,
    isValid: true,
    isRequired: true,
    message: `Set to ${value}`,
    category,
  };
}

/**
 * Optional env var: unset is valid; if set, must be non-empty (Podverse validateOptional semantics).
 */
export function validateOptional(
  varName: string,
  category: string,
  defaultMessage: string = 'Skipped'
): ValidationResult {
  const value = process.env[varName] ?? '';
  const isSet = value.trim() !== '';
  return {
    name: varName,
    isSet,
    isValid: true,
    isRequired: false,
    message: isSet ? 'Set' : defaultMessage,
    category,
  };
}

/**
 * Positive number (integer or float). Used for interval ms and similar.
 */
export function validatePositiveNumber(
  varName: string,
  category: string,
  isRequired: boolean = false,
  min: number = 1,
  max?: number
): ValidationResult {
  const value = process.env[varName];
  const isSet =
    value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '';

  if (!isSet) {
    return {
      name: varName,
      isSet: false,
      isValid: !isRequired,
      isRequired,
      message: isRequired
        ? `Missing - must be a positive number${min > 1 ? ` (min: ${min})` : ''}${max !== undefined ? ` (max: ${max})` : ''}`
        : 'Skipped',
      category,
    };
  }

  const numValue = Number(value);
  if (!Number.isFinite(numValue) || numValue < min || (max !== undefined && numValue > max)) {
    const rangeMsg = max !== undefined ? ` between ${min} and ${max}` : ` >= ${min}`;
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired,
      message: `Invalid number: "${value}" - must be a positive number${rangeMsg}`,
      category,
    };
  }

  return {
    name: varName,
    isSet: true,
    isValid: true,
    isRequired,
    message: `Set to ${value}`,
    category,
  };
}

function getAllAvailableOrListMessage(validValues: readonly string[]): string {
  return `must be "all-available" or comma-delimited list (valid values: ${validValues.join(', ')})`;
}

/**
 * Validates default locale against ALL_AVAILABLE_LOCALES.
 */
export function validateLocale(
  varName: string,
  category: string,
  isRequired: boolean = true
): ValidationResult {
  const value = process.env[varName] ?? '';
  const isSet = value.trim() !== '';

  if (!isSet) {
    return {
      name: varName,
      isSet: false,
      isValid: !isRequired,
      isRequired,
      message: isRequired
        ? `Missing - must be one of: ${ALL_AVAILABLE_LOCALES.join(', ')}`
        : 'Skipped',
      category,
    };
  }

  const trimmedValue = value.trim();
  if (!ALL_AVAILABLE_LOCALES.includes(trimmedValue as Locale)) {
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired,
      message: `Invalid locale: "${value}". Valid locales: ${ALL_AVAILABLE_LOCALES.join(', ')}`,
      category,
    };
  }

  return {
    name: varName,
    isSet: true,
    isValid: true,
    isRequired,
    message: `Valid locale: ${trimmedValue}`,
    category,
  };
}

/**
 * Validates NEXT_PUBLIC_SUPPORTED_LOCALES: "all-available" or comma-separated locales.
 */
export function validateSupportedLocalesList(varName: string, category: string): ValidationResult {
  const value = process.env[varName] ?? '';
  const isSet = value.trim() !== '';

  if (!isSet) {
    return {
      name: varName,
      isSet: false,
      isValid: false,
      isRequired: true,
      message: `Missing - ${getAllAvailableOrListMessage(ALL_AVAILABLE_LOCALES)}`,
      category,
    };
  }

  const trimmedValue = value.trim();

  if (trimmedValue === 'all-available') {
    return {
      name: varName,
      isSet: true,
      isValid: true,
      isRequired: true,
      message: 'Set to "all-available"',
      category,
    };
  }

  const locales = trimmedValue
    .split(',')
    .map((l) => l.trim())
    .filter((l) => l !== '');

  if (locales.length === 0) {
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Empty after parsing - ${getAllAvailableOrListMessage(ALL_AVAILABLE_LOCALES)}`,
      category,
    };
  }

  const invalidLocales = locales.filter(
    (locale) => !ALL_AVAILABLE_LOCALES.includes(locale as Locale)
  );
  if (invalidLocales.length > 0) {
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid locale(s): ${invalidLocales.join(', ')}. Valid locales: ${ALL_AVAILABLE_LOCALES.join(', ')}`,
      category,
    };
  }

  return {
    name: varName,
    isSet: true,
    isValid: true,
    isRequired: true,
    message: `Valid locales: ${locales.join(', ')}`,
    category,
  };
}

/**
 * http(s) URL with no trailing requirement beyond URL parse.
 */
export function validateHttpOrHttpsUrl(varName: string, category: string): ValidationResult {
  const value = process.env[varName];
  const isSet =
    value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '';

  if (!isSet) {
    return {
      name: varName,
      isSet: false,
      isValid: false,
      isRequired: true,
      message: 'Missing - must be a valid http or https URL',
      category,
    };
  }

  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        name: varName,
        isSet: true,
        isValid: false,
        isRequired: true,
        message: `Invalid URL: "${value}" - protocol must be http or https`,
        category,
      };
    }
  } catch {
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid URL: "${value}"`,
      category,
    };
  }

  return {
    name: varName,
    isSet: true,
    isValid: true,
    isRequired: true,
    message: `Set to ${trimmed}`,
    category,
  };
}

/**
 * Optional http(s) URL: unset is valid; if set, must parse as http or https.
 */
export function validateOptionalHttpOrHttpsUrl(
  varName: string,
  category: string
): ValidationResult {
  const value = process.env[varName];
  if (value === undefined || value === null || value.trim() === '') {
    return validateOptional(varName, category, 'Not set');
  }
  return validateHttpOrHttpsUrl(varName, category);
}

/**
 * API version path: non-empty, normalizes to a path with at least one segment (e.g. /v1).
 */
export function validateApiVersionPath(varName: string, category: string): ValidationResult {
  const value = process.env[varName];
  const isSet =
    value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '';

  if (!isSet) {
    return {
      name: varName,
      isSet: false,
      isValid: false,
      isRequired: true,
      message: 'Missing - must be a non-empty path starting with / (e.g. /v1)',
      category,
    };
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return {
      name: varName,
      isSet: false,
      isValid: false,
      isRequired: true,
      message: 'Missing - must be a non-empty path starting with / (e.g. /v1)',
      category,
    };
  }

  const normalized = normalizeVersionPath(trimmed);
  if (normalized === '/' || !normalized.startsWith('/')) {
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid path: "${value}" - must be a version path such as /v1`,
      category,
    };
  }

  return {
    name: varName,
    isSet: true,
    isValid: true,
    isRequired: true,
    message: `Set to ${normalized}`,
    category,
  };
}

/**
 * AUTH_MODE or NEXT_PUBLIC_AUTH_MODE must use the same allow-list as the API.
 */
export function validateAuthMode(varName: string, category: string): ValidationResult {
  const value = process.env[varName];
  const isSet =
    value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '';

  if (!isSet) {
    return {
      name: varName,
      isSet: false,
      isValid: false,
      isRequired: true,
      message: `Missing - must be one of: ${AUTH_MODE_VALUES.join(', ')}`,
      category,
    };
  }

  const normalized = normalizedAuthMode(value);
  if (normalized === undefined || !isAuthModeValue(normalized)) {
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid: "${value}" - must be one of: ${AUTH_MODE_VALUES.join(', ')}`,
      category,
    };
  }

  return {
    name: varName,
    isSet: true,
    isValid: true,
    isRequired: true,
    message: `Set to ${value.trim()}`,
    category,
  };
}

/** Alias for sidecar: validates `NEXT_PUBLIC_AUTH_MODE`. */
export const validateNextPublicAuthMode = validateAuthMode;

const DEFAULT_WEAK_JWT_SECRETS = [
  'secret',
  'jwt_secret',
  'change-me',
  'changeme',
  'change-me-in-production',
  'your-256-bit-secret',
  'supersecret',
];

/**
 * Validates that an env var is set and suitable for use as a JWT secret:
 * - Non-empty
 * - Minimum length (default 32 for HS256)
 * - Not a known weak value
 */
export function validateJwtSecret(
  varName: string,
  category: string,
  options: { minLength?: number; weakValues?: string[] } = {}
): ValidationResult {
  const { minLength = 32, weakValues = DEFAULT_WEAK_JWT_SECRETS } = options;
  const value = process.env[varName];
  const isSet =
    value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '';
  if (!isSet) {
    return {
      name: varName,
      isSet: false,
      isValid: false,
      isRequired: true,
      message: 'Missing or empty',
      category,
    };
  }
  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Too short: must be at least ${minLength} characters for sufficient entropy`,
      category,
    };
  }
  const lower = trimmed.toLowerCase();
  const isWeak = weakValues.some((w) => lower.includes(w) || w === lower);
  if (isWeak) {
    return {
      name: varName,
      isSet: true,
      isValid: false,
      isRequired: true,
      message: 'Value is too weak or predictable; use a long random string',
      category,
    };
  }
  return {
    name: varName,
    isSet: true,
    isValid: true,
    isRequired: true,
    message: 'Set (length and strength OK)',
    category,
  };
}

/**
 * Builds a ValidationSummary from an array of results (Podverse-compatible fields).
 */
export function buildSummary(results: ValidationResult[]): ValidationSummary {
  const total = results.length;
  const passed = results.filter((r) => r.isValid && r.isSet).length;
  const failed = results.filter((r) => !r.isValid).length;
  const requiredMissing = results.filter((r) => r.isRequired && !r.isValid).length;
  const skipped = results.filter((r) => !r.isRequired && !r.isSet).length;
  const defaultsUsed = results.filter(
    (r) => r.isValid && r.isSet && (r.message.includes('Use Default') || r.message === 'Blank')
  ).length;
  return { total, passed, failed, requiredMissing, skipped, defaultsUsed, results };
}

/**
 * Displays validation results by category with checkmarks, then summary (Podverse format).
 */
export function displayValidationResults(summary: ValidationSummary): void {
  console.log('=== Environment Variable Validation ===');

  const byCategory: Record<string, ValidationResult[]> = {};
  for (const result of summary.results) {
    const category = result.category;
    const list = byCategory[category] ?? (byCategory[category] = []);
    list.push(result);
  }

  const categories = Object.keys(byCategory).sort();
  for (const category of categories) {
    console.log(`[${category}]`);
    const list = byCategory[category] ?? [];
    for (const r of list) {
      const status = r.isValid ? '✓' : '✗';
      const requiredText = r.isRequired ? '' : ' (optional)';
      const msg = `  ${status} ${r.name}${requiredText} - ${r.message}`;
      if (!r.isValid) {
        console.error(msg);
      } else if (!r.isSet && !r.isRequired) {
        console.warn(msg);
      } else {
        console.log(msg);
      }
    }
  }

  console.log('=== Validation Summary ===');
  console.log(`Total: ${summary.total}`);
  const passedText =
    summary.defaultsUsed > 0
      ? `Passed: ${summary.passed} (${summary.defaultsUsed} using defaults)`
      : `Passed: ${summary.passed}`;
  console.log(passedText);
  console.log(`Skipped: ${summary.skipped}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Required Missing: ${summary.requiredMissing}`);

  if (summary.failed > 0) {
    console.error('The following environment variables failed validation:');
    summary.results
      .filter((r) => !r.isValid)
      .forEach((r) => {
        const requiredText = r.isRequired ? ' (required)' : ' (optional)';
        console.error(`  - ${r.name}${requiredText}: ${r.message}`);
      });
  }

  if (summary.skipped > 0) {
    console.log('Skipped optional variables (not set):');
    summary.results
      .filter((r) => !r.isRequired && !r.isSet)
      .forEach((r) => console.log(`  - ${r.name}`));
  }
}

/**
 * Runs validation: builds summary from results, displays, throws if any check failed (required or invalid optional).
 * Call after loadEnv(), before importing config.
 */
export function validateStartupRequirements(results: ValidationResult[]): void {
  const summary = buildSummary(results);
  displayValidationResults(summary);
  if (summary.failed > 0) {
    throw new Error(
      `FATAL: ${summary.failed} environment variable validation error(s). Please check the validation output above for details.`
    );
  }
  console.log('Startup validation completed successfully.');
}
