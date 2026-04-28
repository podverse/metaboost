import { expect, test } from '@playwright/test';

import {
  loginAsWebE2ENonAdmin,
  loginAsWebE2EUserAndExpectDashboard,
} from './helpers/advancedFixtures';
import { getE2EApiV1BaseUrl } from './helpers/apiBase';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-09.xml';

async function createTopLevelRssChannelBucket(
  page: import('@playwright/test').Page
): Promise<string> {
  const response = await page.request.post(`${getE2EApiV1BaseUrl()}/buckets`, {
    data: { type: 'rss-channel', rssFeedUrl: RSS_FEED_URL, isPublic: true },
  });
  expect(response.ok()).toBe(true);
  const data = (await response.json()) as { bucket?: { idText?: string } };
  const idText = data.bucket?.idText;
  if (idText === undefined || idText === '') {
    throw new Error('Expected bucket idText from create rss-channel response');
  }
  return idText;
}

test.describe('Legacy public bucket route is removed', () => {
  test('When a non-admin user opens a legacy /b short-bucket URL, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'non-admin');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const bucketIdText = await createTopLevelRssChannelBucket(page);

    await page.context().clearCookies();
    await loginAsWebE2ENonAdmin(page);

    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'Non-admin user opens removed legacy public bucket route and sees not found.',
      async () => {
        await page.goto(`/b/${bucketIdText}`);
      }
    );
  });
});
