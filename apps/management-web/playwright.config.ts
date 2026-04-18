import { defineConfig, devices } from '@playwright/test';

import { TEST_JWT_SECRET_MANAGEMENT_API } from '@metaboost/helpers';

import {
  buildE2eManagementWebAppEnvPrefix,
  buildE2eManagementWebSidecarEnvPrefix,
} from './playwright.e2e-server-env';

/**
 * E2E env for management-api webServer. All vars required by management-api
 * startup validation so the API starts without relying on .env. Same JWT as
 * management-api test setup (TEST_JWT_SECRET_MANAGEMENT_API). Single-quoted so shell treats it as one token.
 */
function shellQuoteJwt(secret: string): string {
  return `'${String(secret).replace(/'/g, "'\"'\"'")}'`;
}

const e2eManagementSidecarEnv = buildE2eManagementWebSidecarEnvPrefix();
const e2eManagementWebAppEnv = buildE2eManagementWebAppEnvPrefix();

const e2eManagementApiEnv = [
  'NODE_OPTIONS="--disable-warning=DEP0060"',
  'NODE_ENV=test',
  'AUTH_MODE=admin_only_username',
  'MANAGEMENT_API_USER_INVITATION_TTL_HOURS=24',
  'MANAGEMENT_API_PORT=4110',
  'MANAGEMENT_API_USER_AGENT="metaboost-management-api-test Bot Local/Management-API/1"',
  `MANAGEMENT_API_JWT_SECRET=${shellQuoteJwt(TEST_JWT_SECRET_MANAGEMENT_API)}`,
  'MANAGEMENT_API_SESSION_COOKIE_NAME=management_api_session',
  'MANAGEMENT_API_REFRESH_COOKIE_NAME=management_api_refresh',
  'MANAGEMENT_API_JWT_ACCESS_EXPIRY_SECONDS=900',
  'MANAGEMENT_API_JWT_REFRESH_EXPIRY_SECONDS=604800',
  'MANAGEMENT_API_CORS_ORIGINS=http://localhost:4112',
  'DB_HOST=localhost',
  'DB_PORT=5632',
  'DB_MANAGEMENT_NAME=metaboost_management_test',
  'DB_MANAGEMENT_READ_WRITE_USER=metaboost_management_read_write',
  'DB_MANAGEMENT_READ_WRITE_PASSWORD=test',
  'DB_APP_NAME=metaboost_app_test',
  'DB_APP_READ_USER=metaboost_app_read',
  'DB_APP_READ_PASSWORD=test',
  'DB_APP_READ_WRITE_USER=metaboost_app_read_write',
  'DB_APP_READ_WRITE_PASSWORD=test',
  'VALKEY_HOST=localhost',
  'VALKEY_PORT=6579',
  'VALKEY_PASSWORD=test',
].join(' ');

/**
 * E2E tests for management-web app. Playwright auto-starts management-api (4110),
 * management-web runtime sidecar (4111), and management-web (4112) in production-like mode
 * (`build` + `start` / `dev:sidecar` for the sidecar).
 * See docs/testing/E2E-PAGE-TESTING.md.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: '../../.artifacts/e2e-test-results/management-web',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 10_000,
  webServer: [
    {
      command: `npm run build -w @metaboost/management-api && ${e2eManagementApiEnv} npm run start -w @metaboost/management-api`,
      port: 4110,
      cwd: '../..',
      reuseExistingServer: false,
      timeout: 420_000,
    },
    {
      command: `npm run build -w @metaboost/management-web-sidecar && ${e2eManagementSidecarEnv} npm run dev:sidecar -w @metaboost/management-web`,
      port: 4111,
      cwd: '../..',
      reuseExistingServer: false,
      timeout: 420_000,
    },
    {
      command: `${e2eManagementWebAppEnv} npm run build -w @metaboost/management-web && NODE_OPTIONS="--disable-warning=DEP0060" ${e2eManagementWebAppEnv} npm run start -w @metaboost/management-web`,
      port: 4112,
      cwd: '../..',
      reuseExistingServer: false,
      timeout: 420_000,
    },
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4112',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
