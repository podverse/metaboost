import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Confirm-email-change page when email verification flows are disabled (admin_only_username).', () => {
  test('When a user opens /auth/confirm-email-change in admin_only_username mode, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to confirm-email-change and is redirected to login because email flows are disabled.',
      async () => {
        await page.goto('/auth/confirm-email-change');
        await expect(page).toHaveURL(/\/login/);
      }
    );
    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The login page is visible because confirm-email-change is not accessible in admin_only_username mode.'
    );
  });

  test('When a user opens /auth/confirm-email-change with a token in admin_only_username mode, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to confirm-email-change with token and is redirected to login.',
      async () => {
        await page.goto('/auth/confirm-email-change?token=invalid');
        await expect(page).toHaveURL(/\/login/);
      }
    );
  });
});
