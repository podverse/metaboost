import { defineConfig, devices } from '@playwright/test';

import { buildE2eWebServers } from './playwright.e2e-webservers';

/**
 * E2E tests for web app. Playwright auto-starts API (4010), sidecar (4011), and web (4012)
 * in production-like mode (`build` + `start`).
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
  webServer: buildE2eWebServers('admin_only_username'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4012',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
