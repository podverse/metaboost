import { defineConfig, devices } from '@playwright/test';

import {
  buildE2eWebApiEnvPrefix,
  buildE2eWebAppEnvPrefix,
  buildE2eWebSidecarEnvPrefix,
} from './playwright.e2e-server-env';

/**
 * E2E tests for web app with signup + verification flows enabled
 * (AUTH_MODE=user_signup_email).
 * API sends verification/reset emails to Mailpit (SMTP 1025). Start Mailpit via: make e2e_mailpit_up.
 * Same ports as default config (4010, 4011, 4012). Run signup-enabled auth specs via make e2e_test_web_signup_enabled.
 * See docs/testing/E2E-PAGE-TESTING.md.
 */
const e2eApiEnv = buildE2eWebApiEnvPrefix('user_signup_email');
const e2eSidecarEnv = buildE2eWebSidecarEnvPrefix('user_signup_email');
const e2eWebAppEnv = buildE2eWebAppEnvPrefix('user_signup_email');

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
