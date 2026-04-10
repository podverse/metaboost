import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/advancedFixtures';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Buckets-list-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the buckets-list-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.context().clearCookies();
    await expectUnauthedRouteRedirectsToLogin(
      page,
      '/buckets',
      'User navigates to the buckets-list-page while not logged in and is redirected to the login-page.',
      testInfo
    );
  });
});
