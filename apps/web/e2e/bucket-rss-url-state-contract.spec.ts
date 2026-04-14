import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mb1-channel-10.xml';

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

test.describe('URL-state contract for rss add-to-rss and messages filters', () => {
  test('When the user opens add-to-rss, refreshes, and navigates back and forward, tab=add-to-rss remains canonical and active.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const bucketShortId = await createTopLevelRssChannelBucket(page);

    await actionAndCapture(
      page,
      testInfo,
      'User opens add-to-rss and verifies that tab=add-to-rss stays in URL across refresh and history navigation.',
      async () => {
        await page.goto(`/bucket/${bucketShortId}?tab=add-to-rss`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${bucketShortId}\\?tab=add-to-rss$`));
        await expect(page.getByRole('link', { name: /add to rss/i })).toBeVisible();

        await page.reload();
        await expect(page).toHaveURL(new RegExp(`/bucket/${bucketShortId}\\?tab=add-to-rss$`));

        await page.getByRole('link', { name: /messages/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${bucketShortId}$`));

        await page.goBack();
        await expect(page).toHaveURL(new RegExp(`/bucket/${bucketShortId}\\?tab=add-to-rss$`));
        await page.goForward();
        await expect(page).toHaveURL(new RegExp(`/bucket/${bucketShortId}$`));
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The add-to-rss tab URL state stays canonical across refresh and browser history.'
    );
  });
});
