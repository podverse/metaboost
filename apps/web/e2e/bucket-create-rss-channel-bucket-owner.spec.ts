import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard, nextFixtureName } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const TOP_LEVEL_RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-01.xml';
const CHILD_RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-02.xml';

function getBucketShortIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'bucket' || segments[1] === undefined || segments[1] === '') {
    throw new Error(`Expected /bucket/<shortId> URL, received: ${url}`);
  }
  return segments[1];
}

test.describe('RSS channel bucket creation for bucket-owner user', () => {
  test('When the user creates a top-level RSS Network, the RSS Network is created from the networked create flow and appears in the buckets list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const rssNetworkName = nextFixtureName('e2e-rss-network-top-level');

    await actionAndCapture(
      page,
      testInfo,
      'User opens the top-level bucket-create page, leaves bucket type as RSS Network, enters an RSS network name, and submits.',
      async () => {
        await page.goto('/buckets/new');
        await expect(page.getByRole('radiogroup', { name: /bucket type/i })).toBeVisible();
        await page.getByRole('radio', { name: /rss network/i }).click();
        await page.getByRole('textbox', { name: /name/i }).fill(rssNetworkName);
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
        await expect(page).toHaveURL(/\/bucket\/[^/]+\/new$/);
      }
    );
    await expect(page.getByText(new RegExp(rssNetworkName, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'After create, the user is taken to Add RSS channel for the empty network (server redirect from bucket detail).'
    );

    await actionAndCapture(
      page,
      testInfo,
      'User opens the buckets list and opens the RSS Network; an empty network still lands on Add RSS channel.',
      async () => {
        await page.goto('/buckets');
        await page
          .getByRole('link', { name: new RegExp(rssNetworkName, 'i') })
          .first()
          .click();
        await expect(page).toHaveURL(/\/bucket\/[^/]+\/new$/);
      }
    );
  });

  test('When the user creates a top-level RSS channel bucket, they are redirected to the new bucket add-to-rss tab and RSS-only no-child-create rules are enforced.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);

    await actionAndCapture(
      page,
      testInfo,
      'User opens the top-level bucket-create page, selects RSS Channel, enters a feed URL, and submits.',
      async () => {
        await page.goto('/buckets/new');
        await expect(page.getByRole('radiogroup', { name: /bucket type/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();
        await page.getByRole('textbox', { name: /rss feed url/i }).fill(TOP_LEVEL_RSS_FEED_URL);
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
      }
    );

    await expect(page).toHaveURL(/\/bucket\/[^/?]+(\?tab=add-to-rss)?$/);
    await expect(page.getByRole('link', { name: /add to rss/i })).toBeVisible();
    await expect(page.getByText(TOP_LEVEL_RSS_FEED_URL)).toBeVisible();

    const createdRssChannelShortId = getBucketShortIdFromUrl(page.url());
    await expect(page.getByRole('link', { name: /add bucket|new bucket/i })).toHaveCount(0);

    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the child-create route for an rss-channel bucket and sees not found because rss-channel buckets cannot have manual children.',
      async () => {
        await page.goto(`/bucket/${createdRssChannelShortId}/new`);
      }
    );
  });

  test('When the user creates an RSS channel under an RSS Network bucket, they are redirected to add-to-rss and RSS Network-only child creation behavior is preserved.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const rssNetworkName = nextFixtureName('e2e-rss-network-parent');

    await page.goto('/buckets/new');
    await expect(page.getByRole('radiogroup', { name: /bucket type/i })).toBeVisible();
    await page.getByRole('radio', { name: /rss network/i }).click();
    await page.getByRole('textbox', { name: /name/i }).fill(rssNetworkName);
    await page.getByRole('button', { name: /add bucket|create|save/i }).click();
    await expect(page).toHaveURL(/\/bucket\/[^/]+\/new$/);

    const parentRssNetworkShortId = getBucketShortIdFromUrl(page.url());
    await expect(page.getByRole('radiogroup', { name: /bucket type/i })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User enters an RSS feed URL in the child create form under an RSS Network and submits.',
      async () => {
        await page.getByRole('textbox', { name: /rss feed url/i }).fill(CHILD_RSS_FEED_URL);
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
      }
    );

    await expect(page).toHaveURL(/\/bucket\/[^/?]+(\?tab=add-to-rss)?$/);
    await expect(page.getByRole('link', { name: /add to rss/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /add bucket|new bucket/i })).toHaveCount(0);

    await capturePageLoad(
      page,
      testInfo,
      'The newly created child RSS channel opens on add-to-rss and no child-create entry point is visible.'
    );
  });
});
