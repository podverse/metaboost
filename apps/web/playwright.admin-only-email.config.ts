import { defineConfig, devices } from '@playwright/test';

import {
  buildE2eWebApiEnvPrefix,
  buildE2eWebAppEnvPrefix,
  buildE2eWebSidecarEnvPrefix,
} from './playwright.e2e-server-env';

/**
 * E2E tests for web app with admin-only-email mode enabled.
 * Public signup is disabled; forgot/reset and other email verification flows remain enabled.
 * Same ports as default config (4010, 4011, 4012).
 */
const e2eApiEnv = buildE2eWebApiEnvPrefix('admin_only_email');
const e2eSidecarEnv = buildE2eWebSidecarEnvPrefix('admin_only_email');
const e2eWebAppEnv = buildE2eWebAppEnvPrefix('admin_only_email');

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../.artifacts/e2e-test-results/web',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 10_000,
  webServer: [
    {
      command: `npm run build -w @boilerplate/api && ${e2eApiEnv} npm run start -w @boilerplate/api`,
      port: 4010,
      cwd: '../..',
      reuseExistingServer: false,
      timeout: 420_000,
    },
    {
      command: `npm run build -w @boilerplate/web-sidecar && ${e2eSidecarEnv} npm run dev:sidecar -w @boilerplate/web`,
      port: 4011,
      cwd: '../..',
      reuseExistingServer: false,
      timeout: 420_000,
    },
    {
      command: `${e2eWebAppEnv} npm run build -w @boilerplate/web && NODE_OPTIONS="--disable-warning=DEP0060" ${e2eWebAppEnv} npm run start -w @boilerplate/web`,
      port: 4012,
      cwd: '../..',
      reuseExistingServer: false,
      timeout: 420_000,
    },
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4012',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
