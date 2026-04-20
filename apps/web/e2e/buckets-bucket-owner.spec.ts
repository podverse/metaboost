import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Buckets-list-page for the bucket-owner user', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsWebE2EUserAndExpectDashboard(page);
  });

  test('When an authenticated user opens the buckets-list-page, they see the list or empty state and the add-bucket link.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the buckets-list-page after login and sees the list or empty state and add-bucket link.',
      async () => {
        await page.goto('/buckets');
        await expect(page).toHaveURL(/\/buckets/);
        await expect(page.getByRole('link', { name: /add bucket|new bucket/i })).toBeVisible();
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /type/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list-page is visible with seed buckets or an empty state and the add-bucket link.'
    );
  });

  test('Bucket names from the seed data are visible in the buckets list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await page.goto('/buckets');
    await expect(page.getByText('E2E Bucket One')).toBeVisible();
    await expect(page.getByText('E2E Bucket Two')).toBeVisible();
    await expect(
      page.getByRole('cell', { name: /rss network|rss channel/i }).first()
    ).toBeVisible();
    const rowCount = await page.getByRole('table').locator('tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(2);
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list-page shows the seed bucket names E2E Bucket One and E2E Bucket Two.'
    );
  });

  test('When the user clicks the add-bucket link, they are taken to the new-bucket-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await page.goto('/buckets');
    await expect(page.getByRole('link', { name: /add bucket|new bucket/i }).first()).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the add-bucket link and is navigated to the new-bucket-page.',
      async () => {
        await page
          .getByRole('link', { name: /add bucket|new bucket/i })
          .first()
          .click();
        await expect(page).toHaveURL(/\/buckets\/new/);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The new-bucket-page is visible after clicking add-bucket.'
    );
  });

  test('When the user opens the buckets-list-page with explicit search, sort, and page query params, the URL and visible content match.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await actionAndCapture(
      page,
      testInfo,
      'User opens the buckets-list-page with explicit search, sort, and page query params.',
      async () => {
        await page.goto('/buckets?search=e2e&sortBy=name&sortOrder=asc&page=1');
        await expect(page).toHaveURL(/\/buckets\?/);
        const currentUrl = new URL(page.url());
        expect(currentUrl.pathname).toBe('/buckets');
        expect(currentUrl.searchParams.get('search')).toBe('e2e');
        expect(currentUrl.searchParams.get('sortBy')).toBe('name');
        expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');
        expect(currentUrl.searchParams.get('page')).toBe('1');
        await expect(page.getByRole('table')).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list-page shows URL params preserved and table visible.'
    );
  });

  test('When the buckets list has no matching buckets, the user sees the empty-state message and the add-bucket link.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await actionAndCapture(
      page,
      testInfo,
      'User opens the buckets-list-page with a search that matches no buckets and sees the empty state.',
      async () => {
        await page.goto('/buckets?search=nonexistentbucketxyz999');
        await expect(page).toHaveURL(/\/buckets\?.*search=nonexistentbucketxyz999/);
        await expect(
          page.getByText(/no buckets yet|create one to get started/i).first()
        ).toBeVisible();
        await expect(page.getByRole('link', { name: /add bucket|new bucket/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list-page shows the empty-state message and the add-bucket link when no buckets match.'
    );
  });
});
