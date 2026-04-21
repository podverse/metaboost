import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard, nextFixtureName } from './helpers/advancedFixtures';
import { getE2EApiV1BaseUrl } from './helpers/apiBase';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const TOP_LEVEL_RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-01.xml';
const CHILD_RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-02.xml';
const DETAIL_TAB_ASSERT_RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-06-alt.xml';

function getBucketShortIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'bucket' || segments[1] === undefined || segments[1] === '') {
    throw new Error(`Expected /bucket/<shortId> URL, received: ${url}`);
  }
  return segments[1];
}

async function createTopLevelRssChannelBucket(
  page: import('@playwright/test').Page,
  rssFeedUrl: string
): Promise<string> {
  const response = await page.request.post(`${getE2EApiV1BaseUrl()}/buckets`, {
    data: { type: 'rss-channel', rssFeedUrl, isPublic: true },
  });
  expect(response.ok()).toBe(true);
  const data = (await response.json()) as { bucket?: { shortId?: string } };
  const shortId = data.bucket?.shortId;
  if (shortId === undefined || shortId === '') {
    throw new Error('Expected bucket shortId from create rss-channel response');
  }
  return shortId;
}

test.describe('Bucket creation flows for bucket-owner user', () => {
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

    await expect(page).toHaveURL(/\/bucket\/[^/?]+\?tab=add-to-rss$/);
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

    await expect(page).toHaveURL(/\/bucket\/[^/?]+\?tab=add-to-rss$/);
    await expect(page.getByRole('link', { name: /add to rss/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /add bucket|new bucket/i })).toHaveCount(0);

    await capturePageLoad(
      page,
      testInfo,
      'The newly created child RSS channel opens on add-to-rss and no child-create entry point is visible.'
    );
  });

  test('When the user creates a top-level Custom bucket, they are redirected to the endpoint tab and can see mb-v1 endpoint guidance.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const customRootName = nextFixtureName('e2e-mb-root-top-level');

    await actionAndCapture(
      page,
      testInfo,
      'User opens the top-level bucket-create page, selects Custom, enters a name, and submits.',
      async () => {
        await page.goto('/buckets/new');
        await expect(page.getByRole('radiogroup', { name: /bucket type/i })).toBeVisible();
        await page.getByRole('radio', { name: /custom/i }).click();
        await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /rss feed url/i })).toHaveCount(0);
        await page.getByRole('textbox', { name: /name/i }).fill(customRootName);
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
        await expect(page).toHaveURL(/\/bucket\/[^/?]+\?tab=endpoint$/);
      }
    );

    const createdRootShortId = getBucketShortIdFromUrl(page.url());
    await expect(page.getByRole('link', { name: /endpoint/i })).toBeVisible();
    await expect(
      page.getByText(new RegExp(`/v1/standard/mb-v1/boost/${createdRootShortId}`))
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /mb-v1 openapi/i })).toBeVisible();

    await capturePageLoad(
      page,
      testInfo,
      'The Custom bucket detail page is visible on the endpoint tab with the mb-v1 ingest URL and openapi link.'
    );
  });

  test('When the user creates a Custom child chain under mb-root and mb-mid, mb buckets show endpoint tabs while rss-channel keeps add-to-rss.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const customRootName = nextFixtureName('e2e-mb-root-chain');
    const customMidName = nextFixtureName('e2e-mb-mid-chain');
    const customLeafName = nextFixtureName('e2e-mb-leaf-chain');

    await actionAndCapture(
      page,
      testInfo,
      'User sets profile baseline currency to EUR before creating the custom chain.',
      async () => {
        await page.goto('/settings?tab=currency');
        await expect(page.getByRole('combobox', { name: /baseline currency/i })).toBeVisible();
        await page.getByRole('combobox', { name: /baseline currency/i }).selectOption('EUR');
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/baseline currency updated/i)).toBeVisible();
      }
    );

    await page.goto('/buckets/new');
    await expect(page.getByRole('radiogroup', { name: /bucket type/i })).toBeVisible();
    await page.getByRole('radio', { name: /custom/i }).click();
    await page.getByRole('textbox', { name: /name/i }).fill(customRootName);
    await page.getByRole('button', { name: /add bucket|create|save/i }).click();
    await expect(page).toHaveURL(/\/bucket\/[^/?]+\?tab=endpoint$/);
    const rootShortId = getBucketShortIdFromUrl(page.url());

    await actionAndCapture(
      page,
      testInfo,
      'User opens root settings currency tab and confirms the new root bucket inherits EUR baseline currency.',
      async () => {
        await page.goto(`/bucket/${rootShortId}/settings?tab=currency`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${rootShortId}/settings\\?tab=currency`));
        await expect(page.getByRole('combobox', { name: /baseline currency/i })).toHaveValue('EUR');
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User opens the root bucket buckets-tab, uses add-bucket, and creates an mb-mid child bucket from the name-only form.',
      async () => {
        await page.goto(`/bucket/${rootShortId}?tab=buckets`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${rootShortId}\\?tab=buckets$`));
        await expect(page.getByRole('link', { name: /buckets/i })).toBeVisible();
        await page
          .getByRole('link', { name: /add bucket/i })
          .first()
          .click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${rootShortId}/new$`));
        await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /rss feed url/i })).toHaveCount(0);
        await page.getByRole('textbox', { name: /name/i }).fill(customMidName);
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
        await expect(page).toHaveURL(/\/bucket\/[^/?]+\?tab=endpoint$/);
      }
    );

    const midShortId = getBucketShortIdFromUrl(page.url());
    await expect(page.getByRole('link', { name: /endpoint/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /add to rss/i })).toHaveCount(0);
    await page.goto(`/bucket/${midShortId}/settings?tab=currency`);
    await expect(page.getByRole('combobox', { name: /baseline currency/i })).toHaveValue('EUR');

    await actionAndCapture(
      page,
      testInfo,
      'User opens the mid bucket buckets-tab, uses add-bucket, and creates an mb-leaf child bucket from the name-only form.',
      async () => {
        await page.goto(`/bucket/${midShortId}?tab=buckets`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${midShortId}\\?tab=buckets$`));
        await page
          .getByRole('link', { name: /add bucket/i })
          .first()
          .click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${midShortId}/new$`));
        await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /rss feed url/i })).toHaveCount(0);
        await page.getByRole('textbox', { name: /name/i }).fill(customLeafName);
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
        await expect(page).toHaveURL(/\/bucket\/[^/?]+\?tab=endpoint$/);
      }
    );

    const leafShortId = getBucketShortIdFromUrl(page.url());
    await expect(page.getByRole('link', { name: /endpoint/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /buckets/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /add bucket/i })).toHaveCount(0);

    const rssChannelShortId = await createTopLevelRssChannelBucket(
      page,
      DETAIL_TAB_ASSERT_RSS_FEED_URL
    );
    await page.goto(`/bucket/${rssChannelShortId}?tab=add-to-rss`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${rssChannelShortId}\\?tab=add-to-rss$`));
    await expect(page.getByRole('link', { name: /add to rss/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /endpoint/i })).toHaveCount(0);

    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User opens the child-bucket-create route for an mb-leaf bucket and sees not found because mb-leaf cannot have child buckets.',
      async () => {
        await page.goto(`/bucket/${leafShortId}/new`);
      }
    );
  });
});
