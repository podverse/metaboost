import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/authAssertions';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management events-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the events-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      testInfo,
      'User navigates to the management events-page while not logged in and is redirected to the login-page.',
      async () => {
        await page.goto('/events');
      }
    );
  });
});
