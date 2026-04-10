import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/advancedFixtures';
import { setE2EUserContext } from './helpers/userContext';

test.describe('User-settings-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the user-settings-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      '/settings',
      'User navigates to the user-settings-page while not logged in and is redirected to the login-page.',
      testInfo
    );
  });
});
