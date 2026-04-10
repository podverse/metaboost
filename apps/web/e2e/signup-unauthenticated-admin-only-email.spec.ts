import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Signup page (admin_only_email)', () => {
  test('When an unauthenticated user visits signup, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');

    await actionAndCapture(
      page,
      testInfo,
      'User navigates to signup and is redirected to login because public signup is disabled in admin_only_email mode.',
      async () => {
        await page.goto('/signup');
        await expect(page).toHaveURL(/\/login/);
      }
    );

    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'Login page is visible because signup route is disabled in admin_only_email mode.'
    );
  });
});
