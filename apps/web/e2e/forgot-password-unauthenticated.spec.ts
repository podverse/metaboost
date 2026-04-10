import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Web forgot-password-page for the unauthenticated user', () => {
  test('When an unauthenticated user visits forgot-password in admin_only_username mode, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to forgot-password and is redirected to login because email flows are disabled in this mode.',
      async () => {
        await page.goto('/forgot-password');
        await expect(page).toHaveURL(/\/login/);
      }
    );
    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The login page is visible because forgot-password is not accessible in admin_only_username mode.'
    );
  });

  test('When a user revisits forgot-password from login in admin_only_username mode, they are redirected back to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/login');

    await actionAndCapture(
      page,
      testInfo,
      'User manually navigates from login to forgot-password and is redirected back to login.',
      async () => {
        await page.goto('/forgot-password');
        await expect(page).toHaveURL(/\/login/);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The user remains on login; forgot-password route is not accessible in admin_only_username mode.'
    );
  });
});
