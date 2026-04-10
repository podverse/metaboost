import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Home page for the unauthenticated user', () => {
  test('When an unauthenticated user visits the home-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User visits the home-page while not logged in and is redirected to the login-page.',
      async () => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('button', { name: /log in|sign in|submit/i })).toBeVisible();
      }
    );
    await capturePageLoad(page, testInfo, 'The login-page is visible after redirect.');
  });
});
