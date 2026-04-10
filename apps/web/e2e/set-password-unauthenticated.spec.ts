import { expect, test } from '@playwright/test';

import { E2E_SET_PASSWORD_TOKEN_RAW } from './helpers/setPasswordToken';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_SET_PASSWORD_USERNAME = 'e2e-setpassword-completed';
const E2E_SET_PASSWORD_NEW_PASSWORD = 'Test!1Aa';

test.describe('Set-password invitation page in admin_only_username mode.', () => {
  test('When an unauthenticated user visits set-password with a token, they see token, username, and password fields.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to set-password and sees the invitation completion form for admin-only username mode.',
      async () => {
        await page.goto('/auth/set-password?token=invalid-token-12345');
      }
    );

    await expect(page.getByLabel(/token|reset token/i)).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/new password/i).first()).toBeVisible();
    await expect(page.getByLabel(/confirm/i).first()).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'Set-password form is visible with username and password fields, and no email field.'
    );
  });

  test('When the user submits set-password with an invalid token, they see invalid-link feedback and remain on the page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/auth/set-password?token=invalid-token-12345');
    await page.getByLabel(/username/i).fill(`set-password-e2e-${Date.now()}`);
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
      'User submits set-password with an invalid token and sees invalid-or-expired-link feedback.',
      async () => {
        await page.getByRole('button', { name: /reset password|set password|submit/i }).click();
        await expect(page.getByText(/invalid or expired link/i)).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/set-password/);
      }
    );
  });

  test('When the user submits set-password with a valid token, they are redirected to login and can log in with the new username and password.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto(`/auth/set-password?token=${E2E_SET_PASSWORD_TOKEN_RAW}`);
    await page.getByLabel(/username/i).fill(E2E_SET_PASSWORD_USERNAME);
    await page
      .getByLabel(/new password/i)
      .first()
      .fill(E2E_SET_PASSWORD_NEW_PASSWORD);
    await page
      .getByLabel(/confirm/i)
      .first()
      .fill(E2E_SET_PASSWORD_NEW_PASSWORD);

    await actionAndCapture(
      page,
      testInfo,
      'User submits set-password with valid token and is redirected to login.',
      async () => {
        await page.getByRole('button', { name: /reset password|set password|submit/i }).click();
        await expect(page).toHaveURL(/\/login/);
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User logs in with the new username and password and reaches the dashboard.',
      async () => {
        await page
          .getByRole('textbox', { name: /email|username/i })
          .fill(E2E_SET_PASSWORD_USERNAME);
        await page.getByLabel(/password/i).fill(E2E_SET_PASSWORD_NEW_PASSWORD);
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
      }
    );
  });
});
