import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Web signup-page for the unauthenticated user', () => {
  test('When an unauthenticated user visits the signup-page in admin_only_username mode, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the signup-page and is redirected to login because signup is disabled in this mode.',
      async () => {
        await page.goto('/signup');
        await expect(page).toHaveURL(/\/login/);
      }
    );
    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The login form is visible because signup is not accessible in admin_only_username mode.'
    );
  });

  test('When a user tries to revisit signup from login while in admin_only_username mode, they are redirected back to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/login');

    await actionAndCapture(
      page,
      testInfo,
      'User manually navigates from login to signup and is redirected back to login.',
      async () => {
        await page.goto('/signup');
        await expect(page).toHaveURL(/\/login/);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The user remains on login; signup route is not accessible in admin_only_username mode.'
    );
  });
});
