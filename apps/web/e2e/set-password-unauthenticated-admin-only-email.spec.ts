import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Set-password invitation page (admin_only_email)', () => {
  test('When an unauthenticated user visits set-password with a token, they see email, username, and password fields.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to set-password and sees invitation completion form with email and username in admin_only_email mode.',
      async () => {
        await page.goto('/auth/set-password?token=invalid-token-12345');
      }
    );

    await expect(page.getByLabel(/token|reset token/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/new password/i).first()).toBeVisible();
    await expect(page.getByLabel(/confirm/i).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'Set-password form is visible with email, username, and password fields in admin_only_email mode.'
    );
  });

  test('When the user submits set-password without email, email validation is shown and submission is blocked.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/auth/set-password?token=invalid-token-12345');
    await page.getByLabel(/username/i).fill(`set-password-email-required-${Date.now()}`);
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
      'User submits set-password without email and sees required-email validation in admin_only_email mode.',
      async () => {
        await page.getByRole('button', { name: /reset password|set password|submit/i }).click();
        await expect(page.getByText(/email is required|required/i)).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/set-password/);
      }
    );
  });
});
