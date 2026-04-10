import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/authAssertions';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management admin-role-new-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the admin-role-new-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      testInfo,
      'User navigates to the management admin-role-new-page while not logged in and is redirected to the login-page.',
      async () => {
        await page.goto('/admins/roles/new');
      }
    );
  });
});
