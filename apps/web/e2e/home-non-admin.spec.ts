import { expect, test } from '@playwright/test';

import { expectPostLoginDashboardVisible, loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Home-page for the basic-user', () => {
  test('When the basic-user visits the home-page while logged in, they are redirected to the dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the home-page (/); the app redirects to the dashboard.',
      async () => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/dashboard/);
        await expectPostLoginDashboardVisible(page);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'Dashboard page is visible; heading and URL are verified.'
    );
  });
});
