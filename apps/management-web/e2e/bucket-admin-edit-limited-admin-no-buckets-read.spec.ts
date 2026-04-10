import { expect, test } from '@playwright/test';

import { loginAsLimitedAdmin } from './helpers/advancedFixtures';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';
const E2E_NON_OWNER_ADMIN_ID = '44444444-4444-4444-a444-444444444444';

test.describe('Management bucket-admin-edit-page for the admin (admins users events:own) user', () => {
  test('When an admin (admins users events:own) opens the bucket-admin-edit-page, they are redirected to the dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_NON_OWNER_ADMIN_ID}/edit`);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /edit admin/i })).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'The admin (admins users events:own) is redirected to the dashboard when opening the bucket-admin-edit-page.'
    );
  });
});
