import { TEST_JWT_SECRET_API } from '@boilerplate/helpers';

/**
 * Vitest setup: set test env before any module that reads process.env (config, orm) is loaded.
 * Uses a dedicated test database (DB_APP_NAME). Create the test DB and run
 * infra/k8s/base/stack/postgres-init/0003_app_schema.sql before running tests (see AGENTS.md).
 * Each test run starts with a clean DB: globalSetup (global-setup.mjs) truncates app tables before any test file.
 * Default ports 5532 (Postgres) and 6479 (Valkey) avoid conflict with Podverse monorepo (5432, 6379).
 * All values are hardcoded so test runs are deterministic and not affected by ambient env.
 */
const testEnv: Record<string, string> = {
  NODE_ENV: 'test',
  API_PORT: '3999',
  WEB_BRAND_NAME: 'boilerplate-api-test',
  API_USER_AGENT: 'boilerplate-api-test Bot Local/API/1',
  AUTH_MODE: 'admin_only_username',
  API_JWT_SECRET: TEST_JWT_SECRET_API,
  API_SESSION_COOKIE_NAME: 'api_session',
  API_REFRESH_COOKIE_NAME: 'api_refresh',
  API_JWT_ACCESS_EXPIRY_SECONDS: '900',
  API_JWT_REFRESH_EXPIRY_SECONDS: '604800',
  DB_HOST: 'localhost',
  DB_PORT: '5532',
  DB_APP_NAME: 'boilerplate_app_test',
  DB_APP_READ_USER: 'boilerplate_app_read',
  DB_APP_READ_PASSWORD: 'test',
  DB_APP_READ_WRITE_USER: 'boilerplate_app_read_write',
  DB_APP_READ_WRITE_PASSWORD: 'test',
  VALKEY_HOST: 'localhost',
  VALKEY_PORT: '6479',
  VALKEY_PASSWORD: 'test',
};

for (const [key, value] of Object.entries(testEnv)) {
  process.env[key] = value;
}
