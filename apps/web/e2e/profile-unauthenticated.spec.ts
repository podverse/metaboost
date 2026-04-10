import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/advancedFixtures';
import { setE2EUserContext } from './helpers/userContext';

test.describe('User-profile-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the user-profile-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      '/profile',
      'User navigates to the user-profile-page while not logged in and is redirected to the login-page.',
      testInfo
    );
  });
});
