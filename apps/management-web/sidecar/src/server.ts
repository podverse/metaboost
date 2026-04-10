/* eslint-disable no-console */
import type { ValidationResult, ValidationSummary } from '@metaboost/helpers';

import http from 'node:http';
import { URL } from 'node:url';

import {
  buildSummary,
  displayValidationResults,
  validateApiVersionPath,
  validateHttpOrHttpsUrl,
  validateLocale,
  validatePositiveNumber,
  validateRequired,
  validateSupportedLocalesList,
} from '@metaboost/helpers';

// Keep key lists in sync with apps/management-web/src/config/runtime-config.ts (ManagementWebRuntimeConfigEnvKey).
const requiredKeys = [
  'NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH',
  'NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS',
  'NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME',
  'NEXT_PUBLIC_WEB_BASE_URL',
  'NEXT_PUBLIC_DEFAULT_LOCALE',
  'NEXT_PUBLIC_SUPPORTED_LOCALES',
  'MANAGEMENT_API_SERVER_BASE_URL',
] as const;

const allKeys = [...requiredKeys];

function validateManagementWebSidecarPort(): ValidationResult {
  const value = process.env.MANAGEMENT_WEB_SIDECAR_PORT;
  const isSet =
    value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '';
  if (!isSet) {
    return {
      name: 'MANAGEMENT_WEB_SIDECAR_PORT',
      isSet: false,
      isValid: false,
      isRequired: true,
      message: 'Missing',
      category: 'Server',
    };
  }
  const port = Number.parseInt(value, 10);
  if (!Number.isFinite(port) || port <= 0) {
    return {
      name: 'MANAGEMENT_WEB_SIDECAR_PORT',
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid value: "${value}" - must be a positive integer`,
      category: 'Server',
    };
  }
  return {
    name: 'MANAGEMENT_WEB_SIDECAR_PORT',
    isSet: true,
    isValid: true,
    isRequired: true,
    message: `Set to ${value}`,
    category: 'Server',
  };
}

function getCategory(key: string): string {
  const map: Record<string, string> = {
    MANAGEMENT_WEB_SIDECAR_PORT: 'Server',
    NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL: 'API',
    NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH: 'API',
    NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS: 'Session',
    NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME: 'Brand',
    NEXT_PUBLIC_WEB_BASE_URL: 'Web',
    NEXT_PUBLIC_DEFAULT_LOCALE: 'i18n',
    NEXT_PUBLIC_SUPPORTED_LOCALES: 'i18n',
    MANAGEMENT_API_SERVER_BASE_URL: 'API',
  };
  return map[key] ?? 'Config';
}

function validateOne(key: string): ValidationResult {
  const category = getCategory(key);
  if (
    key === 'NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL' ||
    key === 'NEXT_PUBLIC_WEB_BASE_URL' ||
    key === 'MANAGEMENT_API_SERVER_BASE_URL'
  ) {
    return validateHttpOrHttpsUrl(key, category);
  }
  if (key === 'NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH') {
    return validateApiVersionPath(key, category);
  }
  if (key === 'NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS') {
    return validatePositiveNumber(key, category, true);
  }
  if (key === 'NEXT_PUBLIC_DEFAULT_LOCALE') {
    return validateLocale(key, category, true);
  }
  if (key === 'NEXT_PUBLIC_SUPPORTED_LOCALES') {
    return validateSupportedLocalesList(key, category);
  }
  return validateRequired(key, category);
}

function buildValidationResults(): ValidationResult[] {
  const results: ValidationResult[] = [];
  results.push(validateManagementWebSidecarPort());
  for (const key of requiredKeys) {
    results.push(validateOne(key));
  }
  return results;
}

const normalizeEnvValue = (value: string | undefined): string | undefined =>
  value === '' ? undefined : value;

function buildRuntimeConfig(): { env: Record<string, string | undefined> } {
  const env: Record<string, string | undefined> = {};
  for (const key of allKeys) {
    env[key] = normalizeEnvValue(process.env[key]);
  }
  return { env };
}

function findMissingRequiredKeys(runtimeConfig: {
  env: Record<string, string | undefined>;
}): string[] {
  return requiredKeys.filter((key) => runtimeConfig.env[key] === undefined);
}

function getPort(): number {
  const portValue = process.env.MANAGEMENT_WEB_SIDECAR_PORT;
  if (!portValue) {
    throw new Error('Missing MANAGEMENT_WEB_SIDECAR_PORT for runtime config sidecar.');
  }
  const port = Number.parseInt(portValue, 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('Invalid MANAGEMENT_WEB_SIDECAR_PORT for runtime config sidecar.');
  }
  return port;
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

console.log('Running startup validation...');
const validationResults = buildValidationResults();
const summary: ValidationSummary = buildSummary(validationResults);
displayValidationResults(summary);
if (summary.requiredMissing > 0) {
  console.error(
    `FATAL: ${summary.requiredMissing} required environment variable(s) are missing or invalid. Please check the validation output above for details.`
  );
  process.exit(1);
}
console.log('Startup validation completed successfully');

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Cache-Control': 'no-store' });
    res.end('Method Not Allowed');
    return;
  }

  if (requestUrl.pathname === '/' || requestUrl.pathname === '') {
    sendJson(res, 200, {
      status: 'ok',
      message: 'Management-web runtime-config sidecar is online',
    });
    return;
  }

  if (requestUrl.pathname !== '/runtime-config') {
    res.writeHead(404, { 'Cache-Control': 'no-store' });
    res.end('Not Found');
    return;
  }

  const runtimeConfig = buildRuntimeConfig();
  const missingKeys = findMissingRequiredKeys(runtimeConfig);
  if (missingKeys.length > 0) {
    sendJson(res, 500, {
      error: 'Missing required runtime config values.',
      missingKeys,
    });
    return;
  }

  sendJson(res, 200, runtimeConfig);
});

const port = getPort();
server.listen(port, '0.0.0.0', () => {
  console.log(`Metaboost management-web runtime-config sidecar listening on port ${port}.`);
});

const onSignal = (): void => {
  server.close(() => process.exit(0));
};
process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);
