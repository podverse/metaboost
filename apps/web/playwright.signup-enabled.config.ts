import { defineConfig, devices } from '@playwright/test';

import { buildE2eWebServers } from './playwright.e2e-webservers';

/**
 * E2E tests for web app with signup + verification flows enabled
 * (ACCOUNT_SIGNUP_MODE=user_signup_email).
 * API sends verification/reset emails to Mailpit (SMTP 1025). Start Mailpit via: make e2e_mailpit_up.
 * Same ports as default config (4010, 4011, 4012). Run signup-enabled auth specs via make e2e_test_web_signup_enabled.
 * See docs/testing/E2E-PAGE-TESTING.md.
 */

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../.artifacts/e2e-test-results/web',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 10_000,
  webServer: buildE2eWebServers('user_signup_email'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4012',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
