import { expect, test } from '@playwright/test';

import { loginAsManagementAdminWithBucketAdmins } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = 'e2ebkt000001';

test.describe('Management bucket-detail-page for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-detail-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-detail-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/99999999-9999-4999-a999-999999999999');
      }
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-detail-page, they see the bucket name and the Buckets/Public links.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}`));
    await expect(page.getByText(/E2E Bucket One/)).toBeVisible();
    await expect(page.getByRole('link', { name: /buckets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /public page/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /messages/i })).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'The admin (buckets:R bucket_admins events:all_admins) sees the bucket-detail-page with Buckets/Public links.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) navigates from the buckets-list-page to bucket-detail via a bucket link, the bucket detail loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto('/buckets');
    await expect(page).toHaveURL(/\/buckets/);
    const detailLink = page.locator(`a[href="/bucket/${E2E_BUCKET1_ID}"]`).first();
    await expect(detailLink).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks a bucket link on the buckets-list-page and reaches the bucket-detail-page.',
      async () => {
        await detailLink.click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}(?:/|$)`));
    await expect(page.getByText(/E2E Bucket One/)).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail-page is visible after navigating from the buckets-list-page.'
    );
  });
});
