import { expect, test } from '@playwright/test';

import { loginAsManagementAdminWithBucketAdmins } from './helpers/advancedFixtures';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management terms-versions routes for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin without super-admin privileges opens terms-version management routes, they are redirected to the dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);

    await page.goto('/terms-versions');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/terms-versions/new');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/terms-version/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/terms-version/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/edit');
    await expect(page).toHaveURL(/\/dashboard/);

    await capturePageLoad(
      page,
      testInfo,
      'The non-super-admin user is redirected to the dashboard from terms-version management routes.'
    );
  });
});
