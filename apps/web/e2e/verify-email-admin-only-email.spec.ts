import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';
import { E2E_VERIFY_EMAIL_TOKEN_RAW } from './helpers/verifyEmailToken';

test.describe('Verify-email page (admin_only_email)', () => {
  test('When the user opens /auth/verify-email with no token, they see invalid-or-expired-link message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to verify-email without token and sees invalid-or-expired-link message.',
      async () => {
        await page.goto('/auth/verify-email');
        await expect(page.getByText(/invalid or expired link/i)).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/verify-email/);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'Verify-email page shows invalid-link message when no token is provided.'
    );
  });

  test('When the user opens /auth/verify-email with an invalid token, they see invalid-or-expired-link message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to verify-email with invalid token and sees invalid-or-expired-link message.',
      async () => {
        await page.goto('/auth/verify-email?token=invalid-token-12345');
        await expect(page.getByText(/invalid or expired link/i)).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/verify-email/);
      }
    );
  });

  test('When the user opens /auth/verify-email with a valid token, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to verify-email with valid token and is redirected to login.',
      async () => {
        await page.goto(`/auth/verify-email?token=${E2E_VERIFY_EMAIL_TOKEN_RAW}`);
        await expect(page).toHaveURL(/\/login/);
      }
    );
    await capturePageLoad(page, testInfo, 'User is on login after successful verify-email.');
  });
});
