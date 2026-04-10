import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Verify-email page when email verification flows are disabled (admin_only_username).', () => {
  test('When a user opens /auth/verify-email in admin_only_username mode, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to verify-email and is redirected to login because email flows are disabled.',
      async () => {
        await page.goto('/auth/verify-email');
        await expect(page).toHaveURL(/\/login/);
      }
    );
    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The login page is visible because verify-email is not accessible in admin_only_username mode.'
    );
  });

  test('When a user opens /auth/verify-email with a token in admin_only_username mode, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to verify-email with token and is redirected to login.',
      async () => {
        await page.goto('/auth/verify-email?token=invalid');
        await expect(page).toHaveURL(/\/login/);
      }
    );
  });
});
