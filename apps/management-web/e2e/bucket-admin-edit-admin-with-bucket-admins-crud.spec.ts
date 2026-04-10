import { expect, test } from '@playwright/test';

import { loginAsManagementAdminWithBucketAdmins } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';
const E2E_NON_OWNER_ADMIN_ID = 'e2eusr000002';

test.describe('Management bucket-admin-edit-page for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin (buckets:R bucket_admins events:all_admins) navigates from the bucket-settings-admins-tab to the bucket-admin-edit-page for a non-owner-admin, the edit page loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-admins-tab and sees the admins-list.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=admins`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=admins`));
    await expect(page.locator(`a[href*="admins/${E2E_NON_OWNER_ADMIN_ID}/edit"]`)).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the edit link for the non-owner-admin and reaches the bucket-admin-edit-page.',
      async () => {
        await page.locator(`a[href*="admins/${E2E_NON_OWNER_ADMIN_ID}/edit"]`).click();
      }
    );
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_NON_OWNER_ADMIN_ID}/edit`)
    );
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-admin-edit-page is visible after navigating from the admins-list.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) clicks Cancel on the bucket-admin-edit-page, they return to the bucket-settings-admins view.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_NON_OWNER_ADMIN_ID}/edit`);
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel and returns to the bucket-settings-admins view.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=admins`));
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-settings-admins view is visible after Cancel.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-admin-edit-page for a non-owner-admin, they see the edit form with Save.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-admin-edit-page for the non-owner-admin and sees the edit form.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_NON_OWNER_ADMIN_ID}/edit`);
      }
    );
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_NON_OWNER_ADMIN_ID}/edit`)
    );
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-admin-edit-page is visible with Save button for the non-owner-admin.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-admin-edit-page with an invalid admin user id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-admin-edit-page with an invalid user id and sees not found.',
      async () => {
        await page.goto(
          `/bucket/${E2E_BUCKET1_ID}/settings/admins/99999999-9999-4999-a999-999999999999/edit`
        );
      }
    );
  });
});
