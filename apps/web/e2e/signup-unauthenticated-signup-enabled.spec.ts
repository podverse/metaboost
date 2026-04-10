import { expect, test } from '@playwright/test';

import { nextFixtureName } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Signup page (user_signup_email)', () => {
  test('When the user submits with a duplicate email, they are redirected to login and see the check-your-email message (no enumeration).', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User submits with seeded duplicate email; is redirected to login with check-your-email message.',
      async () => {
        await page.goto('/signup');
        await expect(page.getByRole('textbox', { name: /username|email/i }).first()).toBeVisible();
        const username = page.getByRole('textbox', { name: /username/i });
        const email = page.getByRole('textbox', { name: /email/i });
        if ((await username.count()) > 0) await username.fill('e2euser');
        await email.fill('e2e-bucket-owner@example.com');
        await page
          .getByLabel(/password/i)
          .first()
          .fill('Test!1Aa');
        const confirm = page.getByLabel(/confirm|repeat password/i);
        if ((await confirm.count()) > 0) await confirm.fill('Test!1Aa');
        await page.getByRole('button', { name: /sign up|create account|submit/i }).click();
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByText(/check your email/i)).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The user is on the login page and sees the check-your-email message (anti-enumeration).'
    );
  });

  test('When the user submits valid signup data, they are redirected to login and see the check-your-email message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    const uniqueId = nextFixtureName('e2e-signup-enabled');
    const email = `${uniqueId}@example.com`;
    const password = 'Test!1Aa';
    await page.goto('/signup');
    await page.getByLabel(/email/i).first().fill(email);
    const usernameInput = page.getByRole('textbox', { name: /username/i });
    if ((await usernameInput.count()) > 0) await usernameInput.fill(uniqueId);
    await page
      .getByLabel(/password/i)
      .first()
      .fill(password);
    const confirm = page.getByLabel(/confirm|repeat password/i);
    if ((await confirm.count()) > 0) await confirm.fill(password);

    await actionAndCapture(
      page,
      testInfo,
      'User submits valid signup data and is redirected to login with check-your-email message.',
      async () => {
        await page.getByRole('button', { name: /sign up|create account|submit/i }).click();
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByText(/check your email/i)).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The user is on the login page and sees the check-your-email message after signup.'
    );
  });
});
