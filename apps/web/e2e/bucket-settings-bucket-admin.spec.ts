import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';

test.describe('Bucket-settings-page for the bucket-admin user', () => {
  test('When the non-owner-admin with bucket permission opens the bucket-settings-page, they see the bucket-settings-page and tabs.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings`));
    await expect(page.getByRole('link', { name: /general/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /admins/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /roles/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-settings-page is visible with general, admins, and roles tabs for the non-owner-admin.'
    );
  });

  test('When the non-owner-admin opens the bucket-settings-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-settings-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/invalid-bucket-99999/settings');
      }
    );
  });

  test('When the non-owner-admin opens the bucket-settings-page with tab=admins, the admins-tab content is shown.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page with tab=admins and sees the admins-tab content.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings?tab=admins`);
      }
    );
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings\\?tab=admins`)
    );
    await expect(page.getByText(/admins/i).first()).toBeVisible();
    await capturePageLoad(page, testInfo, 'The admins-tab is visible for the non-owner-admin.');
  });

  test('When the non-owner-admin opens the bucket-settings-page with tab=roles, the roles-tab content is shown.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page with tab=roles and sees the roles-tab content.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings?tab=roles`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings\\?tab=roles`));
    await expect(page.getByText(/roles/i).first()).toBeVisible();
    await capturePageLoad(page, testInfo, 'The roles-tab is visible for the non-owner-admin.');
  });
});
