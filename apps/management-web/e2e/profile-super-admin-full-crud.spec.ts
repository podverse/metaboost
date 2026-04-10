import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management profile flow for the super-admin user', () => {
  test('When an authenticated user opens the profile-page, they are redirected to the settings-page and can see the profile-tab content.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the profile-page and is redirected to the settings-page.',
      async () => {
        await page.goto('/profile');
      }
    );
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /settings|account/i })).toBeVisible();
    await page.getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/settings\?tab=profile/);
    await expect(page.getByRole('textbox', { name: /display name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /update profile|save/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The settings-page profile tab shows profile content (display name, update button).'
    );
  });

  test('When the user updates the display name on the profile tab and saves, the change persists.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/settings?tab=profile');
    await expect(page.getByRole('textbox', { name: /display name/i })).toBeVisible();
    const newDisplayName = nextFixtureName('e2e-display');
    await page.getByRole('textbox', { name: /display name/i }).fill(newDisplayName);

    await actionAndCapture(
      page,
      testInfo,
      'User saves the profile with a new display name and sees success; the new name persists.',
      async () => {
        await page.getByRole('button', { name: /update profile|save/i }).click();
        await expect(page.getByText(/profile updated|updated/i)).toBeVisible();
      }
    );
    await expect(page.getByRole('textbox', { name: /display name/i })).toHaveValue(newDisplayName);
    await capturePageLoad(
      page,
      testInfo,
      'The profile tab still shows the updated display name after save.'
    );
  });
});
