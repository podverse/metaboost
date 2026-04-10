import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Web reset-password-page for the unauthenticated user', () => {
  test('When a user opens reset-password in admin_only_username mode, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to reset-password and is redirected to login because email flows are disabled in this mode.',
      async () => {
        await page.goto('/reset-password?token=any-token');
        await expect(page).toHaveURL(/\/login/);
      }
    );
    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The login page is visible because reset-password is not accessible in admin_only_username mode.'
    );
  });

  test('When a user revisits reset-password from login in admin_only_username mode, they are redirected back to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/login');

    await actionAndCapture(
      page,
      testInfo,
      'User manually navigates from login to reset-password and is redirected back to login.',
      async () => {
        await page.goto('/reset-password?token=another-token');
        await expect(page).toHaveURL(/\/login/);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The user remains on login; reset-password route is not accessible in admin_only_username mode.'
    );
  });
});
