import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/advancedFixtures';
import { setE2EUserContext } from './helpers/userContext';

test.describe('New-bucket-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the new-bucket-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      '/buckets/new',
      'User navigates to the new-bucket-page while not logged in and is redirected to the login-page.',
      testInfo
    );
  });
});
