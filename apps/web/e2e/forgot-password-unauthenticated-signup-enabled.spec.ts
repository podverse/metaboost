import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Forgot-password page (user_signup_email)', () => {
  test('When the user submits with a valid email, they see the generic check-your-email success message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/forgot-password');
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User submits forgot-password with a valid email and sees the anti-enumeration success message.',
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

    await capturePageLoad(
      page,
      testInfo,
      'The forgot-password page shows a generic success message in signup-enabled mode.'
    );
  });

  test('When the user submits with an invalid email format, they see validation and remain on forgot-password.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto('/forgot-password');
    await page.getByRole('textbox', { name: /email/i }).fill('invalid@email');

    await actionAndCapture(
      page,
      testInfo,
      'User submits an invalid email and sees client-side validation in signup-enabled mode.',
      async () => {
        await page
          .getByRole('button', { name: /send|submit|reset password|forgot|reset link/i })
          .click();
        await expect(
          page.getByText(/Enter a valid email address|Invalid email|valid email/i)
        ).toBeVisible();
        await expect(page).toHaveURL(/\/forgot-password/);
      }
    );
  });
});
