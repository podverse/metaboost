/**
 * Web app env. Use NEXT_PUBLIC_* for client.
 * When RUNTIME_CONFIG_URL is set, values come from the sidecar (getRuntimeConfig()); otherwise from process.env.
 */

import type { WebRuntimeConfigEnvKey } from './runtime-config';

import { getRuntimeConfig } from './runtime-config-store';

function env(key: WebRuntimeConfigEnvKey): string | undefined {
  const val = getRuntimeConfig().env[key];
  return typeof val === 'string' ? val : undefined;
}

/** Base URL of the API (no version path). */
export function getApiUrl(): string {
  const url = env('NEXT_PUBLIC_API_PUBLIC_BASE_URL') ?? '';
  return url.replace(/\/$/, '');
}

/** API version path prefix (e.g. /v1). Always starts with /. */
export function getApiVersionPath(): string {
  const path = env('NEXT_PUBLIC_API_VERSION_PATH')?.trim() ?? '/v1';
  return path.startsWith('/') ? path : `/${path}`;
}

/** Full base URL for API requests (base URL + version path). */
export function getApiBaseUrl(): string {
  return getApiUrl() + getApiVersionPath();
}

/** Public mbrss-v1 boost endpoint URL for RSS `<podcast:metaBoost>` (trailing slash). */
export function getMbrssV1BoostPublicUrl(bucketIdText: string): string {
  return `${getApiBaseUrl()}/standard/mbrss-v1/boost/${bucketIdText}/`;
}

/** mbrss-v1 OpenAPI JSON served by the API (same origin as `NEXT_PUBLIC_API_PUBLIC_BASE_URL`). */
export function getMbrssV1OpenApiSpecUrl(): string {
  return `${getApiBaseUrl()}/standard/mbrss-v1/openapi.json`;
}

/** Public mb-v1 boost endpoint URL (trailing slash). */
export function getMbV1BoostPublicUrl(bucketIdText: string): string {
  return `${getApiBaseUrl()}/standard/mb-v1/boost/${bucketIdText}/`;
}

/** mb-v1 OpenAPI JSON served by the API. */
export function getMbV1OpenApiSpecUrl(): string {
  return `${getApiBaseUrl()}/standard/mb-v1/openapi.json`;
}

/**
 * Server-only: full base URL for pod-internal API calls.
 * Prefer `process.env.API_SERVER_BASE_URL` when set (Playwright/E2E/local overrides). Otherwise use
 * `env()` from runtime-config JSON (K8s: sidecar ConfigMap), then fall back to the browser-facing
 * public API URL.
 */
export function getServerApiBaseUrl(): string {
  const fromProcess = process.env.API_SERVER_BASE_URL?.trim();
  if (fromProcess !== undefined && fromProcess !== '') {
    return fromProcess.replace(/\/$/, '') + getApiVersionPath();
  }
  const backend = env('API_SERVER_BASE_URL')?.trim();
  if (backend !== undefined && backend !== '') {
    return backend.replace(/\/$/, '') + getApiVersionPath();
  }
  return getApiBaseUrl();
}

/** NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE (for server components; pass to client as needed). */
export function getAccountSignupMode(): string | undefined {
  return env('NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE')?.trim();
}

/** NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS (for server/client auth refresh loop). */
export function getSessionRefreshIntervalMs(): string | undefined {
  return env('NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS')?.trim();
}

/** NEXT_PUBLIC_WEB_BRAND_NAME (for server components; pass to client as needed). */
export function getWebBrandName(): string | undefined {
  return env('NEXT_PUBLIC_WEB_BRAND_NAME')?.trim() || undefined;
}

/** NEXT_PUBLIC_LEGAL_NAME used in terms copy interpolation. */
export function getLegalName(): string | undefined {
  return env('NEXT_PUBLIC_LEGAL_NAME')?.trim() || undefined;
}

/** NEXT_PUBLIC_WEB_BRAND_DOMAIN (public-facing web hostname for your deployment). */
export function getWebBrandDomain(): string | undefined {
  return env('NEXT_PUBLIC_WEB_BRAND_DOMAIN')?.trim() || undefined;
}

/** NEXT_PUBLIC_WEB_BASE_URL (e.g. http://localhost:4002). No trailing slash. */
export function getWebAppUrl(): string | undefined {
  const url = env('NEXT_PUBLIC_WEB_BASE_URL')?.trim();
  if (url === undefined || url === '') return undefined;
  return url.replace(/\/$/, '');
}

/** NEXT_PUBLIC_DEFAULT_LOCALE (for i18n). */
export function getDefaultLocaleEnv(): string | undefined {
  return env('NEXT_PUBLIC_DEFAULT_LOCALE')?.trim();
}

/** NEXT_PUBLIC_SUPPORTED_LOCALES (for i18n). */
export function getSupportedLocalesEnv(): string | undefined {
  return env('NEXT_PUBLIC_SUPPORTED_LOCALES')?.trim();
}
