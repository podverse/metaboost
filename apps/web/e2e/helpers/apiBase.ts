/**
 * Base URL for Metaboost HTTP API during Playwright E2E.
 * Matches apps/web/playwright.e2e-server-env.ts (API on port 4010, path /v1).
 * Browser code uses NEXT_PUBLIC_API_PUBLIC_BASE_URL + version path; Playwright
 * request.post('/api/...') would hit Next.js :4012 and 404 — use this instead.
 */
const DEFAULT_E2E_API_PORT = '4010';

export function getE2EApiV1BaseUrl(): string {
  const fromEnv = process.env.PLAYWRIGHT_API_V1_BASE_URL?.trim();
  if (fromEnv !== undefined && fromEnv !== '') {
    return fromEnv.replace(/\/$/, '');
  }
  const port = process.env.E2E_API_PORT ?? DEFAULT_E2E_API_PORT;
  return `http://localhost:${port}/v1`;
}
