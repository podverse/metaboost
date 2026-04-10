import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Bucket-detail-page for the bucket-owner user', () => {
  test('When an authenticated user opens the bucket-detail-page for the seeded bucket, they see the bucket name and content.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-detail-page by short id and sees bucket name and content.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}`));
        await expect(page.getByText('E2E Bucket One')).toBeVisible();
        await expect(page.getByRole('link', { name: /messages/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail-page shows the bucket name E2E Bucket One and settings or messages links.'
    );
  });

  test('When the user opens the bucket-detail-page with an invalid bucket id, they see a 404.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket with an invalid id and sees not found.',
      async () => {
        await page.goto('/bucket/nonexistent-bucket-id-99999');
      }
    );
  });

  test('When the user navigates from the buckets list to a bucket, they see the bucket detail.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates from the buckets list to the seeded bucket and sees the bucket detail.',
      async () => {
        await page.goto('/buckets');
        await expect(page).toHaveURL(/\/buckets/);
        await page.getByRole('link', { name: 'E2E Bucket One' }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}`));
        await expect(page.getByText('E2E Bucket One')).toBeVisible();
        await expect(page.getByRole('link', { name: /messages/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail page is visible after navigating from the buckets list.'
    );
  });
});
