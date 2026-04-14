import { expect, test } from '@playwright/test';

import {
  loginAsWebE2ENonAdmin,
  loginAsWebE2EUserAndExpectDashboard,
} from './helpers/advancedFixtures';
import { actionAndCapture } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mb1-channel-09.xml';

async function createTopLevelRssChannelBucket(
  page: import('@playwright/test').Page
): Promise<string> {
  const response = await page.request.post('/api/buckets', {
    data: { type: 'rss-channel', rssFeedUrl: RSS_FEED_URL, isPublic: true },
  });
  expect(response.ok()).toBe(true);
  const data = (await response.json()) as { bucket?: { shortId?: string } };
  const shortId = data.bucket?.shortId;
  if (shortId === undefined || shortId === '') {
    throw new Error('Expected bucket shortId from create rss-channel response');
  }
  return shortId;
}

test.describe('RSS message filter visibility for non-admin user', () => {
  test('When a non-admin user views the public bucket page, no show-unverified control is rendered.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'non-admin');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const bucketShortId = await createTopLevelRssChannelBucket(page);

    await page.context().clearCookies();
    await loginAsWebE2ENonAdmin(page);

    await actionAndCapture(
      page,
      testInfo,
      'Non-admin user opens the public bucket page and does not see any unverified filter control.',
      async () => {
        await page.goto(`/b/${bucketShortId}`);
        await expect(page).toHaveURL(new RegExp(`/b/${bucketShortId}$`));
        await expect(page.getByRole('checkbox', { name: /show unverified messages/i })).toHaveCount(
          0
        );
      }
    );
  });
});
