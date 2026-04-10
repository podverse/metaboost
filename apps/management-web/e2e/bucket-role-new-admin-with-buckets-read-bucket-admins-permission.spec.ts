import { expect, test } from '@playwright/test';

import { loginAsManagementAdminWithBucketAdmins } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-role-new-page for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-role-new-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-role-new-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/99999999-9999-4999-a999-999999999999/settings/roles/new');
      }
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) navigates from the roles-tab to role-new, they see the new-role form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=roles`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=roles`));
    const createRoleLink = page.getByRole('link', { name: /create role|new role/i });
    await expect(createRoleLink).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks create role from roles-tab and reaches the role-new page.',
      async () => {
        await createRoleLink.click();
      }
    );

    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`));
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save|create/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-role-new form is visible for the permitted admin.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) clicks Cancel on role-new, they return to the bucket-settings roles-tab.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on role-new and returns to the roles-tab.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );

    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=roles`));
    await capturePageLoad(page, testInfo, 'The bucket-settings roles-tab is visible after Cancel.');
  });
});
