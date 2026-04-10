import { expect, test } from '@playwright/test';

import {
  createBucketMessageFixture,
  getCookieHeaderFromPage,
  loginAsManagementAdminWithBucketAdmins,
  loginAsManagementSuperAdmin,
} from './helpers/advancedFixtures';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-message-edit-page for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-message-edit-page, they are redirected to buckets.', async ({
    page,
    request,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementSuperAdmin(page);
    const cookieHeader = await getCookieHeaderFromPage(page);
    const { id: messageId } = await createBucketMessageFixture(
      request,
      E2E_BUCKET1_ID,
      { body: 'E2E mgmt deny message edit', senderName: 'E2E Sender' },
      { cookieHeader }
    );
    await page.context().clearCookies();
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/messages/${messageId}/edit`);
    await expect(page).toHaveURL(/\/buckets/);
    await expect(page.getByRole('heading', { name: /edit message/i })).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'The admin (buckets:R bucket_admins events:all_admins) is redirected to buckets when opening the bucket-message-edit-page.'
    );
  });
});
