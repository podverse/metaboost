import { expect, test } from '@playwright/test';

import {
  loginAsManagementAdminWithBucketAdmins,
  nextFixtureName,
} from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-role-edit-page for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-role-edit-page with an invalid role id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-role-edit-page with an invalid role id and sees not found.',
      async () => {
        await page.goto(
          `/bucket/${E2E_BUCKET1_ID}/settings/roles/99999999-9999-4999-a999-999999999999/edit`
        );
      }
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) navigates from the roles-tab to role-edit, they see the role-edit form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    const roleName = nextFixtureName('e2e-mgmt-role-admin');

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await page.getByRole('textbox', { name: /role name|name/i }).fill(roleName);
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=roles`));

    await actionAndCapture(
      page,
      testInfo,
      'User clicks the edit link for the role and is taken to the role-edit-page.',
      async () => {
        const row = page.locator('li', { hasText: roleName }).first();
        await row.getByRole('link', { name: /edit/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/roles/[^/]+/edit`));
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-role-edit form is visible for the permitted admin.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) clicks Cancel on role-edit, they return to the bucket-settings roles-tab.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    const roleName = nextFixtureName('e2e-mgmt-role-admin-cancel');

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`);
    await page.getByRole('textbox', { name: /role name|name/i }).fill(roleName);
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=roles`));

    const row = page.locator('li', { hasText: roleName }).first();
    await row.getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/roles/[^/]+/edit`));

    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on role-edit and returns to the roles-tab.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=roles`));
    await capturePageLoad(page, testInfo, 'The bucket-settings roles-tab is visible after Cancel.');
  });
});
