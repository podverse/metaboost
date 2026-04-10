import { expect, test } from '@playwright/test';

import { issueForgotPasswordAndGetResetToken } from './helpers/resetPasswordToken';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET_OWNER_EMAIL = 'e2e-bucket-owner@example.com';
const SEED_PASSWORD = 'Test!1Aa';
const NEW_PASSWORD_AFTER_RESET = 'Test!1Ab';

test.describe('Reset-password page (user_signup_email)', () => {
  test('When the user submits with an invalid token, they see the invalid-link error instead of a configuration alert.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/reset-password?token=invalid-token-12345');
    await page
      .getByLabel(/new password/i)
      .first()
      .fill('Test!1Aa');
    await page
      .getByLabel(/confirm/i)
      .first()
      .fill('Test!1Aa');

    await actionAndCapture(
      page,
      testInfo,
      'User submits reset-password with an invalid token and sees the invalid-or-expired-link error in signup-enabled mode.',
      async () => {
        await page.getByRole('button', { name: /reset password|submit|save/i }).click();
        await expect(page.getByText(/invalid or expired link/i)).toBeVisible();
        await expect(page).toHaveURL(/\/reset-password/);
      }
    );

    await capturePageLoad(
      page,
      testInfo,
      'The reset-password page shows invalid-link feedback in signup-enabled mode.'
    );
  });

  test('When the user enters a weak password, the submit button remains disabled.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/reset-password?token=invalid-token-12345');
    await page
      .getByLabel(/new password/i)
      .first()
      .fill('weak');
    await page
      .getByLabel(/confirm/i)
      .first()
      .fill('weak');

    await actionAndCapture(
      page,
      testInfo,
      'User enters a weak password and verifies submit is disabled in signup-enabled mode.',
      async () => {
        await expect(
          page.getByRole('button', { name: /reset password|submit|save/i })
        ).toBeDisabled();
        await expect(page).toHaveURL(/\/reset-password/);
      }
    );
  });

  test('When the user submits with a valid reset token, they are redirected to login and can log in with the new password; then revert so seed user is unchanged.', async ({
    page,
    request,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    const resetToken = await issueForgotPasswordAndGetResetToken(request, E2E_BUCKET_OWNER_EMAIL);
    await page.goto(`/reset-password?token=${resetToken}`);
    await page
      .getByLabel(/new password/i)
      .first()
      .fill(NEW_PASSWORD_AFTER_RESET);
    await page
      .getByLabel(/confirm/i)
      .first()
      .fill(NEW_PASSWORD_AFTER_RESET);

    await actionAndCapture(
      page,
      testInfo,
      'User submits reset-password with valid token and is redirected to login.',
      async () => {
        await page.getByRole('button', { name: /reset password|submit|save/i }).click();
        await expect(page).toHaveURL(/\/login/);
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User logs in with the new password and reaches the dashboard.',
      async () => {
        await page.getByRole('textbox', { name: /email|username/i }).fill(E2E_BUCKET_OWNER_EMAIL);
        await page.getByLabel(/password/i).fill(NEW_PASSWORD_AFTER_RESET);
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User reverts password in settings so the seed user is unchanged for other specs.',
      async () => {
        await page.goto('/settings?tab=password');
        const passwordInputs = page.locator('input[type="password"]');
        await expect(passwordInputs).toHaveCount(3);
        await passwordInputs.nth(0).fill(NEW_PASSWORD_AFTER_RESET);
        await passwordInputs.nth(1).fill(SEED_PASSWORD);
        await passwordInputs.nth(2).fill(SEED_PASSWORD);
        await page.getByRole('button', { name: /change password|save/i }).click();
        await expect(page.getByText(/password changed/i).first()).toBeVisible();
        await expect(page).toHaveURL(/\/settings\?tab=password/);
      }
    );
  });
});
