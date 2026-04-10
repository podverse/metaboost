import { expect, test } from '@playwright/test';

import { loginAsManagementAdminWithBucketAdmins } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management buckets-list page for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin (buckets:R bucket_admins events:all_admins) opens the buckets-list page, they see the buckets heading and list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto('/buckets');
    await expect(page).toHaveURL(/\/buckets/);
    await expect(page.getByRole('heading', { name: /buckets/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admin (buckets:R bucket_admins events:all_admins) sees the buckets-list page.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) clicks a bucket row link from the buckets-list page, they reach bucket-detail.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto('/buckets');
    await expect(page).toHaveURL(/\/buckets/);
    const detailLink = page.locator('a[href^="/bucket/"]').first();
    await expect(detailLink).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks a bucket link from the buckets-list and reaches bucket-detail.',
      async () => {
        await detailLink.click();
      }
    );
    await expect(page).toHaveURL(/\/bucket\//);
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail-page is visible after navigating from the buckets-list.'
    );
  });
});
