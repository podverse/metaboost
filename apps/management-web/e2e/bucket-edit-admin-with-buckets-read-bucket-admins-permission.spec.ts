import { expect, test } from '@playwright/test';

import { loginAsManagementAdminWithBucketAdmins } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = 'e2ebkt000001';

test.describe('Management bucket-edit-page for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-edit-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-edit-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/99999999-9999-4999-a999-999999999999/edit');
      }
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-edit-page, they are redirected to bucket-settings and see the edit form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/edit`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings`));
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The permitted admin sees the bucket-edit form after redirect from bucket-edit.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) navigates to buckets-list, they do not see edit actions.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto('/buckets');
    await expect(page).toHaveURL(/\/buckets/);
    await expect(page.locator(`a[href*="/bucket/${E2E_BUCKET1_ID}/edit"]`)).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list is visible and no edit actions are available for this admin role.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) clicks Cancel on bucket-edit, they return to the bucket-view page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/edit`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings`));
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel and returns to bucket-view page.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}(?:/|$)`));
    await capturePageLoad(page, testInfo, 'The bucket-view page is visible after Cancel.');
  });
});
