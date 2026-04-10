import { expect, test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Dashboard-page for the basic-user', () => {
  test('When the basic-user opens the dashboard-page after login, they see the dashboard heading.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the dashboard-page and sees the dashboard.',
      async () => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
      }
    );
    await capturePageLoad(page, testInfo, 'The dashboard-page is visible for the basic-user.');
  });
});
