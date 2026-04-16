import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-05.xml';

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

test.describe('RSS add-to-rss tab for bucket-owner user', () => {
  test('When the bucket owner opens add-to-rss for an rss-channel bucket, the expected snippet, copy action, and verify button are visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const bucketShortId = await createTopLevelRssChannelBucket(page);

    await actionAndCapture(
      page,
      testInfo,
      'User opens the buckets tab before verification and sees guidance that item buckets appear after Add-to-RSS setup and verify.',
      async () => {
        await page.goto(`/bucket/${bucketShortId}?tab=buckets`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${bucketShortId}\\?tab=buckets$`));
        await expect(page.getByText(/no rss item buckets yet/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /open add to rss tab/i })).toBeVisible();
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User opens the rss-channel bucket add-to-rss tab and sees the canonical snippet and verify controls.',
      async () => {
        await page.goto(`/bucket/${bucketShortId}?tab=add-to-rss`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${bucketShortId}\\?tab=add-to-rss$`));
        await expect(page.getByRole('link', { name: /add to rss/i })).toBeVisible();
        await expect(page.getByText(/podcast:metaBoost standard="mbrss-v1"/i)).toBeVisible();
        await expect(
          page.getByText(new RegExp(`/v1/s/mbrss-v1/boost/${bucketShortId}/`))
        ).toBeVisible();
        await expect(page.getByRole('button', { name: /copy snippet/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /verify metaboost enabled/i })).toBeVisible();
      }
    );

    await capturePageLoad(
      page,
      testInfo,
      'The add-to-rss tab is visible with snippet copy controls and the verify button for the rss-channel bucket.'
    );
  });
});
