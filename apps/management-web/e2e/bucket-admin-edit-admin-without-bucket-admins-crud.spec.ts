import { test } from '@playwright/test';

import { loginAsManagementAdminWithoutBucketAdmins } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';
const E2E_NON_OWNER_ADMIN_ID = '44444444-4444-4444-a444-444444444444';

test.describe('Management bucket-admin-edit-page for the admin (buckets:R events:all_admins) user', () => {
  test('When an admin (buckets:R events:all_admins) opens the bucket-admin-edit-page, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R events:all_admins)');
    await loginAsManagementAdminWithoutBucketAdmins(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-admin-edit-page without bucketAdminsCrud and sees not found.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_NON_OWNER_ADMIN_ID}/edit`);
      }
    );
  });
});
