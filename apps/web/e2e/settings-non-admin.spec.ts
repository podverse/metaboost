import { expect, test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('User-settings-page for the basic-user', () => {
  test('When the basic-user opens the user-settings-page, they see the settings content with tabs or heading.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the user-settings-page and sees tabs or profile and password sections.',
      async () => {
        await page.goto('/settings');
        await expect(page).toHaveURL(/\/settings/);
        await expect(
          page
            .getByRole('tab', { name: /profile|general|password/i })
            .or(page.getByRole('heading', { name: /settings|profile|account/i }))
        ).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The user-settings-page is visible for the basic-user (self only).'
    );
  });
});
