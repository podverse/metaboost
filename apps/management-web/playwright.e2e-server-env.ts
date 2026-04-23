/**
 * Shared env prefixes for Playwright management-web E2E webServer commands.
 * Mirrors apps/web/playwright.e2e-server-env.ts: sidecar + Next are self-contained so
 * layout SSR does not depend on empty RUNTIME_CONFIG_URL or sidecar/.env.
 * See docs/testing/E2E-PAGE-TESTING.md.
 */

const E2E_MANAGEMENT_API_PORT = '4110';
const E2E_MANAGEMENT_SIDECAR_PORT = '4111';
const E2E_MANAGEMENT_WEB_PORT = '4112';

/** Browser-facing management API origin (must be http(s) URL for sidecar `validateHttpOrHttpsUrl`). */
const E2E_MANAGEMENT_API_PUBLIC_BASE_URL = `http://localhost:${E2E_MANAGEMENT_API_PORT}`;

/** Same main-app origin as web E2E (`NEXT_PUBLIC_WEB_BASE_URL` for management-web runtime config). */
const E2E_WEB_BASE_URL = 'http://localhost:4012';

/**
 * Env prefix for `npm run dev:sidecar -w @metaboost/management-web` during E2E.
 * Supplies every key required by apps/management-web/sidecar/src/server.ts.
 */
export function buildE2eManagementWebSidecarEnvPrefix(): string {
  return [
    'NODE_OPTIONS="--disable-warning=DEP0060"',
    `MANAGEMENT_WEB_SIDECAR_PORT=${E2E_MANAGEMENT_SIDECAR_PORT}`,
    `NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL=${E2E_MANAGEMENT_API_PUBLIC_BASE_URL}`,
    'NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH=/v1',
    'NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS=1800000',
    'NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME="E2E Management"',
    'NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN="localhost"',
    `NEXT_PUBLIC_WEB_BASE_URL=${E2E_WEB_BASE_URL}`,
    'NEXT_PUBLIC_DEFAULT_LOCALE=en-US',
    'NEXT_PUBLIC_SUPPORTED_LOCALES=en-US,es',
    `MANAGEMENT_API_SERVER_BASE_URL=http://127.0.0.1:${E2E_MANAGEMENT_API_PORT}`,
  ].join(' ');
}

/**
 * Env prefix for `npm run build` / `npm run start -w @metaboost/management-web` during E2E.
 */
export function buildE2eManagementWebAppEnvPrefix(): string {
  return [
    `PORT=${E2E_MANAGEMENT_WEB_PORT}`,
    `RUNTIME_CONFIG_URL=http://localhost:${E2E_MANAGEMENT_SIDECAR_PORT}`,
    `MANAGEMENT_API_SERVER_BASE_URL=http://localhost:${E2E_MANAGEMENT_API_PORT}`,
    `NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL=${E2E_MANAGEMENT_API_PUBLIC_BASE_URL}`,
    `NEXT_PUBLIC_WEB_BASE_URL=${E2E_WEB_BASE_URL}`,
    'NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS=1800000',
  ].join(' ');
}
