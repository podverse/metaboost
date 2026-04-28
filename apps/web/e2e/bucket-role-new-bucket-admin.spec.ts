import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';

test.describe('Bucket-role-new-page for the bucket-admin user', () => {
  test('When the non-owner-admin with bucket roles permission opens the bucket-role-new-page, they see the bucket-role-new-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/roles/new`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/roles/new`));
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save|create/i })).toBeVisible();
  });

  test('When the non-owner-admin opens the bucket-role-new-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-role-new-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/invalid-bucket-99999/settings/roles/new');
      }
    );
  });

  test('When the non-owner-admin navigates from the roles-list to the bucket-role-new-page, they see the bucket-role-new-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings?tab=roles`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings\\?tab=roles`));
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the new-role link and reaches the bucket-role-new-page.',
      async () => {
        await page.getByRole('link', { name: /add role|new role|create/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/roles/new`));
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-role-new-form is visible after navigating from the roles-list.'
    );
  });

  test('When the non-owner-admin clicks Cancel on the bucket-role-new-page, they return to the roles-list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/roles/new`);
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on the bucket-role-new-page and returns to the roles-list.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings\\?tab=roles`));
    await capturePageLoad(page, testInfo, 'The roles-list is visible after Cancel.');
  });
});
