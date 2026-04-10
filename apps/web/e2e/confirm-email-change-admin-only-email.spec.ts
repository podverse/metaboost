import { expect, test } from '@playwright/test';

import { E2E_CONFIRM_EMAIL_CHANGE_TOKEN_RAW } from './helpers/confirmEmailChangeToken';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Confirm-email-change page (admin_only_email)', () => {
  test('When the user opens /auth/confirm-email-change with no token, they see invalid-or-expired-link message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to confirm-email-change without token and sees invalid-or-expired-link message.',
      async () => {
        await page.goto('/auth/confirm-email-change');
        await expect(page.getByText(/invalid or expired link/i)).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/confirm-email-change/);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'Confirm-email-change page shows invalid-link message when no token is provided.'
    );
  });

  test('When the user opens /auth/confirm-email-change with an invalid token, they see invalid-or-expired-link message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to confirm-email-change with invalid token and sees invalid-or-expired-link message.',
      async () => {
        await page.goto('/auth/confirm-email-change?token=invalid-token-12345');
        await expect(page.getByText(/invalid or expired link/i)).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/confirm-email-change/);
      }
    );
  });

  test('When the user opens /auth/confirm-email-change with a valid token, they are redirected (to settings, then to login when unauthenticated).', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to confirm-email-change with valid token and is redirected away from the confirm page.',
      async () => {
        await page.goto(`/auth/confirm-email-change?token=${E2E_CONFIRM_EMAIL_CHANGE_TOKEN_RAW}`);
        await expect(page).not.toHaveURL(/\/auth\/confirm-email-change/);
        await expect(page).toHaveURL(/\/(settings|login)/);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'User left confirm-email-change page after successful token consumption.'
    );
  });
});
