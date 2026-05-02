/**
 * Management web app env. Use NEXT_PUBLIC_* for client.
 * When RUNTIME_CONFIG_URL is set, values come from the sidecar (getRuntimeConfig()); otherwise from process.env.
 */

import type { ManagementWebRuntimeConfigEnvKey } from './runtime-config';

import { getRuntimeConfig } from './runtime-config-store';

function env(key: ManagementWebRuntimeConfigEnvKey): string | undefined {
  const val = getRuntimeConfig().env[key];
  return typeof val === 'string' ? val : undefined;
}

/** Base URL of the management API (no version path). */
export function getManagementApiUrl(): string {
  const url = env('NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL') ?? '';
  return url.replace(/\/$/, '');
}

/** API version path prefix (e.g. /v1). Always starts with /. */
export function getManagementApiVersionPath(): string {
  const path = env('NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH')?.trim() ?? '/v1';
  return path.startsWith('/') ? path : `/${path}`;
}

/** Full base URL for API requests (base URL + version path). Used by client and by server when MANAGEMENT_API_SERVER_BASE_URL is not set. */
export function getManagementApiBaseUrl(): string {
  return getManagementApiUrl() + getManagementApiVersionPath();
}

/**
 * Server-only: base URL for backend API (used by proxy and getServerUser).
 * Prefer `process.env.MANAGEMENT_API_SERVER_BASE_URL` when set (Playwright/E2E/local overrides).
 * Otherwise use `env()` from runtime-config JSON (K8s: sidecar ConfigMap), then fall back to public API URL.
 */
export function getServerManagementApiBaseUrl(): string {
  const fromProcess = process.env.MANAGEMENT_API_SERVER_BASE_URL?.trim();
  if (fromProcess !== undefined && fromProcess !== '') {
    return fromProcess.replace(/\/$/, '') + getManagementApiVersionPath();
  }
  const backend = env('MANAGEMENT_API_SERVER_BASE_URL')?.trim();
  if (backend !== undefined && backend !== '') {
    return backend.replace(/\/$/, '') + getManagementApiVersionPath();
  }
  return getManagementApiBaseUrl();
}

/**
 * Base URL of the main web app (e.g. http://localhost:4002). No trailing slash.
 * Used for: "Public page" link from bucket detail; invitation links (so they point to the web app, not management-web).
 * When set, public and invite links use this base. When unset, public link falls back to same-origin; invite link is path-only.
 */
export function getWebAppUrl(): string | undefined {
  const url = env('NEXT_PUBLIC_WEB_BASE_URL')?.trim();
  if (url === undefined || url === '') return undefined;
  return url.replace(/\/$/, '');
}

/** NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME (for server components; pass to client as needed). */
export function getManagementWebBrandName(): string | undefined {
  return env('NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME')?.trim() || undefined;
}

/** NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN (public-facing management-web hostname for your deployment). */
export function getManagementWebBrandDomain(): string | undefined {
  return env('NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN')?.trim() || undefined;
}

/** NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS (for server; pass to client as needed). */
export function getSessionRefreshIntervalMs(): string | undefined {
  return env('NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS')?.trim();
}

/** NEXT_PUBLIC_DEFAULT_LOCALE (for i18n). */
export function getDefaultLocaleEnv(): string | undefined {
  return env('NEXT_PUBLIC_DEFAULT_LOCALE')?.trim();
}

/** NEXT_PUBLIC_SUPPORTED_LOCALES (for i18n). */
export function getSupportedLocalesEnv(): string | undefined {
  return env('NEXT_PUBLIC_SUPPORTED_LOCALES')?.trim();
}
