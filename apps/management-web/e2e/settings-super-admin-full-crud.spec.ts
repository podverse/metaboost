import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management settings-page for the super-admin user', () => {
  test('When an authenticated user opens the settings-page, they see the settings content with General, Profile, and Password tabs.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management settings-page and sees the settings content with tabs.',
      async () => {
        await page.goto('/settings');
      }
    );
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /settings|account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^general$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /password/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The settings-page is visible with General, Profile, and Password tabs.'
    );
  });

  test('When the user opens the settings-page with the password tab, the password form is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the settings-page password tab and sees the password form.',
      async () => {
        await page.goto('/settings?tab=password');
      }
    );
    await expect(page).toHaveURL(/\/settings\?tab=password/);
    await expect(page.getByLabel(/current password|new password|password/i).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The password-tab form (current password, new password) is visible.'
    );
  });
});
