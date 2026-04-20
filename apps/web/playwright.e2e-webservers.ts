import type { PlaywrightTestConfig } from '@playwright/test';

import {
  buildE2eWebApiEnvPrefix,
  buildE2eWebAppEnvPrefix,
  buildE2eWebSidecarEnvPrefix,
  type WebE2EAuthMode,
} from './playwright.e2e-server-env';

const E2E_REGISTRY_PORT = 4020;
const E2E_API_PORT = 4010;
const E2E_SIDECAR_PORT = 4011;
const E2E_WEB_PORT = 4012;
const REPO_ROOT_CWD = '../..';

/**
 * Playwright webServer entries: local Standard Endpoint app registry (4020), API, sidecar, web.
 * API waits for the registry static server so AppAssertion can resolve signing keys.
 */
export function buildE2eWebServers(mode: WebE2EAuthMode): PlaywrightTestConfig['webServer'] {
  const e2eApiEnv = buildE2eWebApiEnvPrefix(mode);
  const e2eSidecarEnv = buildE2eWebSidecarEnvPrefix(mode);
  const e2eWebAppEnv = buildE2eWebAppEnvPrefix(mode);

  return [
    {
      command: `npx --yes serve@14.2.4 apps/web/e2e/fixtures/registry-static -l ${E2E_REGISTRY_PORT}`,
      port: E2E_REGISTRY_PORT,
      cwd: REPO_ROOT_CWD,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx --yes wait-on@7.2.0 tcp:127.0.0.1:${E2E_REGISTRY_PORT} && npm run build -w @metaboost/api && ${e2eApiEnv} npm run start -w @metaboost/api`,
      port: E2E_API_PORT,
      cwd: REPO_ROOT_CWD,
      reuseExistingServer: false,
      timeout: 420_000,
    },
    {
      command: `npm run build -w @metaboost/web-sidecar && ${e2eSidecarEnv} npm run dev:sidecar -w @metaboost/web`,
      port: E2E_SIDECAR_PORT,
      cwd: REPO_ROOT_CWD,
      reuseExistingServer: false,
      timeout: 420_000,
    },
    {
      command: `${e2eWebAppEnv} npm run build -w @metaboost/web && NODE_OPTIONS="--disable-warning=DEP0060" ${e2eWebAppEnv} npm run start -w @metaboost/web`,
      port: E2E_WEB_PORT,
      cwd: REPO_ROOT_CWD,
      reuseExistingServer: false,
      timeout: 420_000,
    },
  ];
}
