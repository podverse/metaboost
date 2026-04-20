import { TEST_JWT_SECRET_API } from '@metaboost/helpers';

/**
 * Shared env prefixes for Playwright web E2E webServer commands.
 * Keeps API, sidecar, and Next.js processes self-contained (no reliance on ambient
 * API_JWT_SECRET, API_CORS_ORIGINS, or sidecar/.env for API_SERVER_BASE_URL).
 * See docs/testing/E2E-PAGE-TESTING.md.
 */

export type WebE2EAuthMode = 'admin_only_username' | 'admin_only_email' | 'user_signup_email';

const E2E_API_PORT = '4010';
const E2E_WEB_PORT = '4012';
const E2E_SIDECAR_PORT = '4011';

/** Shell-safe single-quoted JWT (same pattern as management-web Playwright). */
function shellQuoteJwt(secret: string): string {
  return `'${String(secret).replace(/'/g, "'\"'\"'")}'`;
}

function authModeUsesEmailFlows(mode: WebE2EAuthMode): boolean {
  return mode === 'admin_only_email' || mode === 'user_signup_email';
}

/**
 * Env prefix for `npm run start -w @metaboost/api` during web E2E.
 */
export function buildE2eWebApiEnvPrefix(mode: WebE2EAuthMode): string {
  const jwt = shellQuoteJwt(TEST_JWT_SECRET_API);
  const parts: string[] = [
    'NODE_OPTIONS="--disable-warning=DEP0060"',
    'NODE_ENV=test',
    `AUTH_MODE=${mode}`,
    `API_PORT=${E2E_API_PORT}`,
    'API_USER_AGENT="metaboost-web-e2e Bot Local/API/1"',
    `API_JWT_SECRET=${jwt}`,
    'API_SESSION_COOKIE_NAME=api_session',
    'API_REFRESH_COOKIE_NAME=api_refresh',
    'API_JWT_ACCESS_EXPIRY_SECONDS=900',
    'API_JWT_REFRESH_EXPIRY_SECONDS=604800',
    `API_CORS_ORIGINS=http://localhost:${E2E_WEB_PORT}`,
    'WEB_BRAND_NAME="E2E Web"',
    'DB_HOST=localhost',
    'DB_PORT=5632',
    'DB_APP_NAME=metaboost_app_test',
    'DB_APP_READ_USER=metaboost_app_read',
    'DB_APP_READ_PASSWORD=test',
    'DB_APP_READ_WRITE_USER=metaboost_app_read_write',
    'DB_APP_READ_WRITE_PASSWORD=test',
    'VALKEY_HOST=localhost',
    'VALKEY_PORT=6579',
    'VALKEY_PASSWORD=test',
    /** Local static server (Playwright webServer) serves e2e/fixtures/registry-static for mbrss AppAssertion. */
    'STANDARD_ENDPOINT_REGISTRY_URL=http://127.0.0.1:4020',
  ];

  if (authModeUsesEmailFlows(mode)) {
    parts.push(
      'MAILER_HOST=localhost',
      'MAILER_PORT=1025',
      'MAILER_FROM=test@test.com',
      `WEB_BASE_URL=http://localhost:${E2E_WEB_PORT}`
    );
  } else {
    parts.push('MAILER_USER=', 'MAILER_PASSWORD=');
  }

  return parts.join(' ');
}

/**
 * Env prefix for `npm run dev:sidecar -w @metaboost/web` during web E2E.
 * Supplies every key required by apps/web/sidecar/src/server.ts so sidecar/.env
 * values cannot point SSR at the wrong API port.
 */
export function buildE2eWebSidecarEnvPrefix(mode: WebE2EAuthMode): string {
  const publicAuth = mode;
  return [
    'NODE_OPTIONS="--disable-warning=DEP0060"',
    `WEB_SIDECAR_PORT=${E2E_SIDECAR_PORT}`,
    `NEXT_PUBLIC_API_PUBLIC_BASE_URL=http://localhost:${E2E_API_PORT}`,
    `NEXT_PUBLIC_AUTH_MODE=${publicAuth}`,
    'NEXT_PUBLIC_WEB_BRAND_NAME="E2E Web"',
    'NEXT_PUBLIC_API_VERSION_PATH=/v1',
    'NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS=600000',
    `NEXT_PUBLIC_WEB_BASE_URL=http://localhost:${E2E_WEB_PORT}`,
    'NEXT_PUBLIC_DEFAULT_LOCALE=en-US',
    'NEXT_PUBLIC_SUPPORTED_LOCALES=en-US,es',
    `API_SERVER_BASE_URL=http://127.0.0.1:${E2E_API_PORT}`,
  ].join(' ');
}

/**
 * Env prefix for `npm run build` / `npm run start -w @metaboost/web` during web E2E.
 */
export function buildE2eWebAppEnvPrefix(mode: WebE2EAuthMode): string {
  const publicAuth = mode;
  return [
    `PORT=${E2E_WEB_PORT}`,
    `RUNTIME_CONFIG_URL=http://localhost:${E2E_SIDECAR_PORT}`,
    `NEXT_PUBLIC_API_PUBLIC_BASE_URL=http://localhost:${E2E_API_PORT}`,
    `NEXT_PUBLIC_AUTH_MODE=${publicAuth}`,
    'NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS=600000',
  ].join(' ');
}
