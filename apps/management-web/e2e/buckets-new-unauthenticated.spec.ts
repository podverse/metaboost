import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/authAssertions';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management buckets-new page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the buckets-new page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      testInfo,
      'User navigates to the management buckets-new page while not logged in and is redirected to the login-page.',
      async () => {
        await page.goto('/buckets/new');
      }
    );
  });
});
