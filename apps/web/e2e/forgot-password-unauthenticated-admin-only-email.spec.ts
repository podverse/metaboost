import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Forgot-password page (admin_only_email)', () => {
  test('When an unauthenticated user visits forgot-password, they see the forgot-password form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');

    await actionAndCapture(
      page,
      testInfo,
      'User navigates to forgot-password and sees the form in admin_only_email mode.',
      async () => {
        await page.goto('/forgot-password');
      }
    );

    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /send|submit|reset password|forgot|reset link/i })
    ).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'Forgot-password form is visible in admin_only_email mode.'
    );
  });

  test('When the user submits a valid email, they see the generic check-your-email success message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/forgot-password');

    await actionAndCapture(
      page,
      testInfo,
      'User submits forgot-password with a valid email and sees anti-enumeration success message in admin_only_email mode.',
      async () => {
        await page.getByRole('textbox', { name: /email/i }).fill('e2e-bucket-owner@example.com');
        await page
          .getByRole('button', { name: /send|submit|reset password|forgot|reset link/i })
          .click();
        await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
        await expect(page.getByText(/if an account exists/i)).toBeVisible();
        await expect(page).toHaveURL(/\/forgot-password/);
      }
    );
  });
});
