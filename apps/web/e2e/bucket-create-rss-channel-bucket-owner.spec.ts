import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard, nextFixtureName } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const TOP_LEVEL_RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mb1-channel-01.xml';
const CHILD_RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mb1-channel-02.xml';

function getBucketShortIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'bucket' || segments[1] === undefined || segments[1] === '') {
    throw new Error(`Expected /bucket/<shortId> URL, received: ${url}`);
  }
  return segments[1];
}

test.describe('RSS channel bucket creation for bucket-owner user', () => {
  test('When the user creates a top-level group, the group is created from the grouped create flow and appears in the buckets list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const groupName = nextFixtureName('e2e-group-top-level');

    await actionAndCapture(
      page,
      testInfo,
      'User opens the top-level bucket-create page, leaves bucket type as Group, enters a group name, and submits.',
      async () => {
        await page.goto('/buckets/new');
        await expect(page.getByRole('combobox', { name: /bucket type/i })).toBeVisible();
        await page.getByRole('textbox', { name: /name/i }).fill(groupName);
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
        await expect(page).toHaveURL(/\/buckets$/);
      }
    );
    await expect(page.getByText(new RegExp(groupName, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The buckets list page is visible and includes the newly created top-level group.'
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
        await page.getByRole('combobox', { name: /bucket type/i }).selectOption('rss-channel');
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

  test('When the user creates an RSS channel under a group bucket, they are redirected to add-to-rss and group-only child creation behavior is preserved.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const groupName = nextFixtureName('e2e-group-parent');

    await page.goto('/buckets/new');
    await expect(page.getByRole('combobox', { name: /bucket type/i })).toBeVisible();
    await page.getByRole('textbox', { name: /name/i }).fill(groupName);
    await page.getByRole('button', { name: /add bucket|create|save/i }).click();
    await expect(page).toHaveURL(/\/buckets$/);
    await page
      .getByRole('link', { name: new RegExp(groupName, 'i') })
      .first()
      .click();
    await expect(page).toHaveURL(/\/bucket\/[^/?]+$/);

    const parentGroupShortId = getBucketShortIdFromUrl(page.url());
    await page.goto(`/bucket/${parentGroupShortId}?tab=buckets`);
    await expect(page.getByRole('link', { name: /add bucket|new bucket/i }).first()).toBeVisible();
    await page
      .getByRole('link', { name: /add bucket|new bucket/i })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/bucket/${parentGroupShortId}/new$`));
    await expect(page.getByRole('combobox', { name: /bucket type/i })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User enters an RSS feed URL in the child create form under a group and submits.',
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
