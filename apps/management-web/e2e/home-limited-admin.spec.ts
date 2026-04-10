import { expect, test } from '@playwright/test';

import { loginAsLimitedAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management home-page for the admin (admins users events:own) user', () => {
  test('When an admin (admins users events:own) visits the home-page, they are redirected to dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User visits the home-page while logged in and is redirected to dashboard.',
      async () => {
        await page.goto('/');
      }
    );
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await capturePageLoad(page, testInfo, 'The dashboard is visible after home redirect.');
  });
});
