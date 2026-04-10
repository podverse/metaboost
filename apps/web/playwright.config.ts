import { defineConfig, devices } from '@playwright/test';

import {
  buildE2eWebApiEnvPrefix,
  buildE2eWebAppEnvPrefix,
  buildE2eWebSidecarEnvPrefix,
} from './playwright.e2e-server-env';

/**
 * E2E tests for web app. Playwright auto-starts API (4010), sidecar (4011), and web (4012)
 * in production-like mode (`build` + `start`).
 * See docs/testing/E2E-PAGE-TESTING.md.
 */
const e2eApiEnv = buildE2eWebApiEnvPrefix('admin_only_username');
const e2eSidecarEnv = buildE2eWebSidecarEnvPrefix('admin_only_username');
const e2eWebAppEnv = buildE2eWebAppEnvPrefix('admin_only_username');

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
      command: `npm run build -w @metaboost/api && ${e2eApiEnv} npm run start -w @metaboost/api`,
      port: 4010,
      cwd: '../..',
      reuseExistingServer: false,
      timeout: 420_000,
    },
    {
      command: `npm run build -w @metaboost/web-sidecar && ${e2eSidecarEnv} npm run dev:sidecar -w @metaboost/web`,
      port: 4011,
      cwd: '../..',
      reuseExistingServer: false,
      timeout: 420_000,
    },
    {
      command: `${e2eWebAppEnv} npm run build -w @metaboost/web && NODE_OPTIONS="--disable-warning=DEP0060" ${e2eWebAppEnv} npm run start -w @metaboost/web`,
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
