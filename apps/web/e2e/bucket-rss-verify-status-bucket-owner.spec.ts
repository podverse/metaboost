import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { getE2EApiV1BaseUrl } from './helpers/apiBase';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

/** Not used in other e2e specs; one POST for both tests (serial) avoids duplicate feed rows on re-runs. */
const RSS_VERIFY_STATUS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-99.xml';

async function createTopLevelRssChannelBucket(
  page: import('@playwright/test').Page
): Promise<string> {
  const response = await page.request.post(`${getE2EApiV1BaseUrl()}/buckets`, {
    data: { type: 'rss-channel', rssFeedUrl: RSS_VERIFY_STATUS_FEED_URL, isPublic: true },
  });
  if (!response.ok()) {
    throw new Error(
      `POST /buckets not OK: ${response.status()} ${await response.text().catch(() => '')}`
    );
  }
  const data = (await response.json()) as { bucket?: { shortId?: string } };
  const shortId = data.bucket?.shortId;
  if (shortId === undefined || shortId === '') {
    throw new Error('Expected bucket shortId from create rss-channel response');
  }
  return shortId;
}

test.describe('RSS verification status for bucket-owner user', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedRssVerifyBucketShortId: string | undefined;

  test('When verification succeeds from add-to-rss, the page shows a last-verified timestamp status.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    sharedRssVerifyBucketShortId = await createTopLevelRssChannelBucket(page);

    await page.goto(`/bucket/${sharedRssVerifyBucketShortId}?tab=add-to-rss`);
    await expect(page.getByText(/not verified yet/i)).toBeVisible();

    await page.route('**/v1/buckets/*/rss/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          verified: true,
          parsedPodcastGuid: 'mock-guid',
          parsedChannelTitle: 'mock-title',
          sync: {
            totalFeedItemsWithGuid: 1,
            activeItemBuckets: 1,
            createdItemBuckets: 0,
            updatedItemBuckets: 0,
            orphanedItemBuckets: 0,
            restoredItemBuckets: 0,
          },
        }),
      });
    });

    await actionAndCapture(
      page,
      testInfo,
      'User clicks verify on add-to-rss and sees the verification status update after a successful response.',
      async () => {
        await page.getByRole('button', { name: /verify e2e web enabled/i }).click();
        await expect(page.getByText(/rss verified successfully/i)).toBeVisible();
        await expect(page.getByText(/last verified successfully/i)).toBeVisible();
      }
    );
  });

  test('When verification fails from add-to-rss, the page shows the server error message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    if (sharedRssVerifyBucketShortId === undefined) {
      sharedRssVerifyBucketShortId = await createTopLevelRssChannelBucket(page);
    }
    const bucketShortId = sharedRssVerifyBucketShortId;

    await page.goto(`/bucket/${bucketShortId}?tab=add-to-rss`);
    await page.route('**/v1/buckets/*/rss/verify', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'RSS verification failed: missing podcast:metaBoost tag' }),
      });
    });

    await actionAndCapture(
      page,
      testInfo,
      'User clicks verify on add-to-rss and sees an actionable verification failure message from the server.',
      async () => {
        await page.getByRole('button', { name: /verify e2e web enabled/i }).click();
        await expect(page.getByText(/missing podcast:metaBoost tag/i)).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The add-to-rss tab displays the verification failure message after verify returns an error.'
    );
  });
});
