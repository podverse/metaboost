import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Login page (user_signup_email)', () => {
  test('When an unauthenticated user visits login, the signup link and forgot-password link are visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to login in signup-enabled mode and verifies signup and forgot-password links are visible.',
      async () => {
        await page.goto('/login');
      }
    );

    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'Login page shows signup and forgot-password links in user_signup_email mode.'
    );
  });

  test('When the user clicks the signup link, they navigate to the signup page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/login');

    await actionAndCapture(
      page,
      testInfo,
      'User clicks signup from login and lands on signup page.',
      async () => {
        await page.getByRole('link', { name: /sign up/i }).click();
        await expect(page).toHaveURL(/\/signup/);
      }
    );
  });

  test('When the user clicks the forgot-password link, they navigate to the forgot-password page.', async ({
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
