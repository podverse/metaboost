import { expect, type APIRequestContext } from '@playwright/test';

import { getE2EApiV1BaseUrl } from './apiBase';

const E2E_WEB_APP_ID = 'metaboost-e2e-web';
const E2E_SUSPENDED_APP_ID = 'metaboost-e2e-suspended';

/**
 * The local E2E registry (static `serve` on :4020) is not a GitHub directory listing, so
 * `AppRegistryService.listRegistryAppIds` only includes app ids already in the
 * in-process `loadAppRecord` cache. GET mb-v1 for an app id loads that record, but
 * `resolveBoostBucket` only accepts mb-* boost bucket types, so the seeded E2E
 * `rss-network` short id returns 404 and does not load apps. Create a temporary
 * `mb-root`, call GET mb-v1 with `?app_id=` for each E2E fixture app, then delete the
 * bucket. Registry cache entries keep the apps listed for
 * `GET /buckets/:id/registry-apps`.
 */
export async function primeLocalRegistryAppCacheForE2E(request: APIRequestContext): Promise<void> {
  const create = await request.post(`${getE2EApiV1BaseUrl()}/buckets`, {
    data: { type: 'mb-root', name: `E2E registry cache ${Date.now()}`, isPublic: true },
  });
  expect(create.ok()).toBe(true);
  const data = (await create.json()) as { bucket?: { shortId?: string } };
  const shortId = data.bucket?.shortId;
  if (shortId === undefined || shortId === '') {
    throw new Error('Expected bucket shortId when creating mb-root for registry cache priming');
  }
  const v1 = getE2EApiV1BaseUrl();
  const w = await request.get(`${v1}/standard/mb-v1/boost/${shortId}?app_id=${E2E_WEB_APP_ID}`);
  const s = await request.get(
    `${v1}/standard/mb-v1/boost/${shortId}?app_id=${E2E_SUSPENDED_APP_ID}`
  );
  expect(w.ok()).toBe(true);
  expect(s.ok()).toBe(true);
  const del = await request.delete(`${v1}/buckets/${shortId}`);
  expect(del.ok()).toBe(true);
}
