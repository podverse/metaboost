import { expect, test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/authAssertions';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management dashboard-page for the unauthenticated user', () => {
  test('When an unauthenticated user visits the dashboard-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      testInfo,
      'User visits the dashboard-page while unauthenticated and is redirected to the login-page.',
      async () => {
        await page.goto('/dashboard');
      }
    );
    await expect(page.getByRole('button', { name: /log in|sign in|submit/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The login-page is visible after unauthenticated user is redirected from the dashboard-page.'
    );
  });
});
