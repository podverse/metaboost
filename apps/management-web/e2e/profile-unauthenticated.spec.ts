import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/authAssertions';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management profile flow for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the profile-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      testInfo,
      'User navigates to the management profile-page while not logged in and is redirected to the login-page.',
      async () => {
        await page.goto('/profile');
      }
    );
  });
});
