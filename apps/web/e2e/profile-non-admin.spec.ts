import { expect, test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('User-profile-page for the basic-user', () => {
  test('When the basic-user opens the user-profile-page, they are redirected to settings and see the settings page (e.g. General tab).', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the user-profile-page and is redirected to settings; the settings page (e.g. General tab) is visible.',
      async () => {
        await page.goto('/profile');
        await expect(page).toHaveURL(/\/settings/);
        await expect(
          page
            .getByRole('tab', { name: /profile|general|password/i })
            .or(page.getByRole('heading', { name: /settings|profile|account/i }))
        ).toBeVisible();
      }
    );
    await capturePageLoad(page, testInfo, 'The settings page is visible (e.g. General tab).');
  });
});
