import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Login page (admin_only_email)', () => {
  test('When an unauthenticated user visits login, the signup link is hidden and forgot-password link is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to login in admin_only_email mode and verifies link visibility.',
      async () => {
        await page.goto('/login');
      }
    );

    await expect(page.getByRole('link', { name: /sign up/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'Login page hides signup and shows forgot-password in admin_only_email mode.'
    );
  });

  test('When the user clicks forgot-password, navigation to forgot-password page succeeds.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/login');

    await actionAndCapture(
      page,
      testInfo,
      'User clicks forgot-password from login and lands on forgot-password page.',
      async () => {
        await page.getByRole('link', { name: /forgot password/i }).click();
        await expect(page).toHaveURL(/\/forgot-password/);
      }
    );
  });
});
