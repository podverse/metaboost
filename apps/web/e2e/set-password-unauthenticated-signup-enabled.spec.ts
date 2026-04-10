import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Set-password invitation page (user_signup_email)', () => {
  test('When an unauthenticated user visits set-password while invitation links are disabled, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');

    await actionAndCapture(
      page,
      testInfo,
      'User navigates to set-password and is redirected to login in signup-enabled mode.',
      async () => {
        await page.goto('/auth/set-password?token=invalid-token-12345');
        await expect(page).toHaveURL(/\/login/);
      }
    );

    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'Login page is visible because set-password invitations are not enabled in signup-enabled mode.'
    );
  });
});
