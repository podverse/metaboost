import { expect, test } from '@playwright/test';

import { loginAsManagementAdminWithBucketAdmins } from './helpers/advancedFixtures';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management buckets-new page for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin (buckets:R bucket_admins events:all_admins) opens the buckets-new page without buckets create, they are redirected to the buckets list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto('/buckets/new');
    await expect(page).toHaveURL(/\/buckets/);
    await capturePageLoad(
      page,
      testInfo,
      'The admin (buckets:R bucket_admins events:all_admins) is redirected to the buckets list when opening the buckets-new page.'
    );
  });
});
