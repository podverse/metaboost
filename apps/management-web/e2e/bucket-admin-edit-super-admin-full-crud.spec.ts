import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';
const E2E_MAIN_USER_ID = 'e2eusr000001';
const E2E_NON_OWNER_ADMIN_ID = 'e2eusr000002';

test.describe('Management bucket-admin-edit-page for the super-admin user', () => {
  test('When the user opens the bucket-admin-edit-page with an invalid admin user id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the management bucket-admin-edit-page with an invalid user id and sees not found.',
      async () => {
        await page.goto(
          `/bucket/${E2E_BUCKET1_ID}/settings/admins/99999999-9999-4999-a999-999999999999/edit`
        );
      }
    );
  });

  test('When the user opens the bucket-admin-edit-route with the bucket-owner user id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-admin-edit-page with the bucket-owner user id and sees not found.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_MAIN_USER_ID}/edit`);
      }
    );
  });

  test('When the super-admin navigates from the bucket-settings-admins-tab to the bucket-admin-edit-page for a non-owner-admin, the bucket-admin-edit-page loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-admins-tab and sees the admins-list.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=admins`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=admins`));
    await expect(page.getByRole('link', { name: /^admins$/i })).toBeVisible();
    await expect(page.locator(`a[href*="admins/${E2E_NON_OWNER_ADMIN_ID}/edit"]`)).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the edit link for a non-owner-admin and reaches the bucket-admin-edit-page.',
      async () => {
        await page.locator(`a[href*="admins/${E2E_NON_OWNER_ADMIN_ID}/edit"]`).click();
      }
    );
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_NON_OWNER_ADMIN_ID}/edit`)
    );
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-admin-edit-page is visible after navigating from the admins-list.'
    );
  });

  test('When the super-admin clicks Cancel on the bucket-admin-edit-page, they return to the bucket-settings-admins view.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
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
    await expect(page.getByRole('link', { name: /^admins$/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-settings-admins view is visible after Cancel.'
    );
  });

  test('When the super-admin saves the bucket-admin-edit-form for a non-owner-admin, the admin is updated and they return to the admins-list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_NON_OWNER_ADMIN_ID}/edit`);
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_NON_OWNER_ADMIN_ID}/edit`)
    );
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Save on the bucket-admin-edit-form for the non-owner-admin.',
      async () => {
        await page.getByRole('button', { name: /save/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=admins`));
    await expect(page.getByRole('link', { name: /^admins$/i })).toBeVisible();
    await capturePageLoad(page, testInfo, 'The admins-list is visible after Save.');
  });
});
