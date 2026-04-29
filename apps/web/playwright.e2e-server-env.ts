import { TEST_JWT_SECRET_API } from '@metaboost/helpers';

/**
 * Shared env prefixes for Playwright web E2E webServer commands.
 * Keeps API, sidecar, and Next.js processes self-contained (no reliance on ambient
 * API_JWT_SECRET, API_CORS_ORIGINS, or sidecar/.env for API_SERVER_BASE_URL).
 * See docs/testing/E2E-PAGE-TESTING.md.
 */

export type WebE2EAccountSignupMode =
  | 'admin_only_username'
  | 'admin_only_email'
  | 'user_signup_email';
export type WebServerEnv = Record<string, string>;

const E2E_API_PORT = '4010';
const E2E_WEB_PORT = '4012';
const E2E_SIDECAR_PORT = '4011';
const E2E_TEST_DB_PORT = '5632';
const E2E_TEST_KEYVALDB_PORT = '6579';

function accountSignupModeUsesEmailFlows(mode: WebE2EAccountSignupMode): boolean {
  return mode === 'admin_only_email' || mode === 'user_signup_email';
}

/**
 * API env object for Playwright webServer `env` (more reliable than shell prefixes).
 */
export function buildE2eWebApiEnv(mode: WebE2EAccountSignupMode): WebServerEnv {
  const env: WebServerEnv = {
    NODE_OPTIONS: '--disable-warning=DEP0060',
    NODE_ENV: 'test',
    API_SKIP_DOTENV: '1',
    ACCOUNT_SIGNUP_MODE: mode,
    API_PORT: E2E_API_PORT,
    API_USER_AGENT: 'metaboost-web-e2e Bot Local/API/1',
    API_JWT_SECRET: TEST_JWT_SECRET_API,
    API_SESSION_COOKIE_NAME: 'api_session',
    API_REFRESH_COOKIE_NAME: 'api_refresh',
    API_JWT_ACCESS_EXPIRATION: '900',
    API_JWT_REFRESH_EXPIRATION: '604800',
    API_CORS_ORIGINS: `http://localhost:${E2E_WEB_PORT}`,
    WEB_BRAND_NAME: 'E2E Web',
    DB_HOST: 'localhost',
    DB_PORT: E2E_TEST_DB_PORT,
    DB_APP_NAME: 'metaboost_app_test',
    DB_APP_READ_USER: 'metaboost_app_read',
    DB_APP_READ_PASSWORD: 'test',
    DB_APP_READ_WRITE_USER: 'metaboost_app_read_write',
    DB_APP_READ_WRITE_PASSWORD: 'test',
    KEYVALDB_HOST: 'localhost',
    KEYVALDB_PORT: E2E_TEST_KEYVALDB_PORT,
    KEYVALDB_PASSWORD: 'test',
    // Local static server (Playwright webServer) serves registry fixtures for AppAssertion keys.
    STANDARD_ENDPOINT_REGISTRY_URL: 'http://127.0.0.1:4020',
    STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS: '127.0.0.1',
    API_EXCHANGE_RATES_FETCH_ENABLED: 'true',
    API_RSS_FEED_FETCH_ENABLED: 'true',
    /** Local RSS feed URLs in Playwright (http://localhost:<web>/e2e/rss/...). */
    METABOOST_E2E_RSS_ALLOW_LOOPBACK: '1',
    API_MESSAGES_TERMS_OF_SERVICE_URL: 'http://localhost:4002/terms',
    API_PUBLIC_BASE_URL: `http://localhost:${E2E_API_PORT}`,
    API_EXCHANGE_RATES_FIAT_BASE_CURRENCY: 'USD',
    API_EXCHANGE_RATES_FIAT_PROVIDER_URL: 'https://api.frankfurter.app/latest?from=USD',
    API_EXCHANGE_RATES_BTC_PROVIDER_URL:
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    API_EXCHANGE_RATES_CACHE_TTL_MS: '600000',
  };

  if (accountSignupModeUsesEmailFlows(mode)) {
    env.MAILER_HOST = 'localhost';
    env.MAILER_PORT = '1025';
    env.MAILER_FROM = 'test@test.com';
    env.WEB_BASE_URL = `http://localhost:${E2E_WEB_PORT}`;
  } else {
    env.MAILER_USER = '';
    env.MAILER_PASSWORD = '';
  }

  return env;
}

/**
 * Env prefix retained for compatibility with existing tests/callers.
 */
export function buildE2eWebApiEnvPrefix(mode: WebE2EAccountSignupMode): string {
  const env = buildE2eWebApiEnv(mode);
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value.includes(' ') ? `"${value}"` : value}`)
    .join(' ');
}

/**
 * Env prefix for `npm run dev:sidecar -w @metaboost/web` during web E2E.
 * Supplies every key required by apps/web/sidecar/src/server.ts so sidecar/.env
 * values cannot point SSR at the wrong API port.
 */
export function buildE2eWebSidecarEnvPrefix(mode: WebE2EAccountSignupMode): string {
  const publicAuth = mode;
  return [
    'NODE_OPTIONS="--disable-warning=DEP0060"',
    `WEB_SIDECAR_PORT=${E2E_SIDECAR_PORT}`,
    `NEXT_PUBLIC_API_PUBLIC_BASE_URL=http://localhost:${E2E_API_PORT}`,
    `NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE=${publicAuth}`,
    'NEXT_PUBLIC_WEB_BRAND_NAME="E2E Web"',
    'NEXT_PUBLIC_LEGAL_NAME="E2E Web Legal"',
    'NEXT_PUBLIC_API_VERSION_PATH=/v1',
    'NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS=600000',
    `NEXT_PUBLIC_WEB_BASE_URL=http://localhost:${E2E_WEB_PORT}`,
    'NEXT_PUBLIC_WEB_BRAND_DOMAIN=localhost',
    'NEXT_PUBLIC_DEFAULT_LOCALE=en-US',
    'NEXT_PUBLIC_SUPPORTED_LOCALES=en-US,es',
    `API_SERVER_BASE_URL=http://127.0.0.1:${E2E_API_PORT}`,
  ].join(' ');
}

/**
 * Env prefix for `npm run build` / `npm run start -w @metaboost/web` during web E2E.
 */
export function buildE2eWebAppEnvPrefix(mode: WebE2EAccountSignupMode): string {
  const publicAuth = mode;
  return [
    `PORT=${E2E_WEB_PORT}`,
    `RUNTIME_CONFIG_URL=http://localhost:${E2E_SIDECAR_PORT}`,
    `NEXT_PUBLIC_API_PUBLIC_BASE_URL=http://localhost:${E2E_API_PORT}`,
    `NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE=${publicAuth}`,
    'NEXT_PUBLIC_LEGAL_NAME="E2E Web Legal"',
    'NEXT_PUBLIC_WEB_BRAND_DOMAIN=localhost',
    'NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS=600000',
  ].join(' ');
}
