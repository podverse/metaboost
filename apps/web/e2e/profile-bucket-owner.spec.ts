import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('User-profile-page for the bucket-owner user', () => {
  test('When an authenticated user opens the user-profile-page, they are redirected to settings and see the settings page (e.g. General tab).', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the user-profile-page and is redirected to settings; the settings page (e.g. General tab) is visible.',
      async () => {
        await page.goto('/profile');
        await expect(page).toHaveURL(/\/settings/);
        await expect(page.getByText(/e2e bucket owner/i)).toBeVisible();
      }
    );
    await capturePageLoad(page, testInfo, 'The settings page is visible (e.g. General tab).');
  });

  test('When the authenticated user opens the profile tab, updates display name, and saves, the change persists and success feedback is shown.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto('/settings?tab=profile');
    await expect(page).toHaveURL(/\/settings\?tab=profile/);
    const displayNameInput = page.getByRole('textbox', { name: /display name/i });
    await expect(displayNameInput).toBeVisible();
    const newName = `E2E Profile ${Date.now()}`;
    await displayNameInput.fill(newName);

    await actionAndCapture(
      page,
      testInfo,
      'User clicks update profile and sees success feedback; the new display name persists.',
      async () => {
        await page.getByRole('button', { name: /update profile|save/i }).click();
        await expect(page.getByText(/profile updated|updated successfully/i).first()).toBeVisible();
        await expect(page.getByText(new RegExp(newName, 'i')).first()).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The profile tab shows success message and the updated display name.'
    );
  });
});
