import { TEST_JWT_SECRET_MANAGEMENT_API } from '@boilerplate/helpers';

/**
 * Vitest setup: set test env before any module that reads process.env is loaded.
 * Uses dedicated test databases (main and management). Create both test DBs and run
 * init scripts before running tests (see AGENTS.md). Default ports 5532 (Postgres).
 * All values are hardcoded so test runs are deterministic and not affected by ambient env.
 */
const testEnv: Record<string, string> = {
  NODE_ENV: 'test',
  AUTH_MODE: 'admin_only_username',
  MANAGEMENT_API_PORT: '4100',
  MANAGEMENT_API_USER_AGENT: 'boilerplate-management-api-test Bot Local/Management-API/1',
  MANAGEMENT_API_JWT_SECRET: TEST_JWT_SECRET_MANAGEMENT_API,
  MANAGEMENT_API_SESSION_COOKIE_NAME: 'management_api_session',
  MANAGEMENT_API_REFRESH_COOKIE_NAME: 'management_api_refresh',
  MANAGEMENT_API_JWT_ACCESS_EXPIRY_SECONDS: '900',
  MANAGEMENT_API_JWT_REFRESH_EXPIRY_SECONDS: '604800',
  MANAGEMENT_API_USER_INVITATION_TTL_HOURS: '24',
  DB_MANAGEMENT_NAME: 'boilerplate_management_test',
  DB_MANAGEMENT_READ_WRITE_USER: 'boilerplate_management_read_write',
  DB_MANAGEMENT_READ_WRITE_PASSWORD: 'test',
  DB_HOST: 'localhost',
  DB_PORT: '5532',
  DB_APP_NAME: 'boilerplate_app_test',
  DB_APP_READ_USER: 'boilerplate_app_read',
  DB_APP_READ_PASSWORD: 'test',
  DB_APP_READ_WRITE_USER: 'boilerplate_app_read_write',
  DB_APP_READ_WRITE_PASSWORD: 'test',
};

for (const [key, value] of Object.entries(testEnv)) {
  process.env[key] = value;
}

declare global {
  var __MANAGEMENT_API_TEST_DIAGNOSTICS_INSTALLED__: boolean | undefined;
}

if (!globalThis.__MANAGEMENT_API_TEST_DIAGNOSTICS_INSTALLED__) {
  globalThis.__MANAGEMENT_API_TEST_DIAGNOSTICS_INSTALLED__ = true;

  process.on('unhandledRejection', (reason) => {
    console.error('[management-api test] unhandledRejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[management-api test] uncaughtException:', error);
  });
}
