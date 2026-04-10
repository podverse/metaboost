import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/authAssertions';
import { setE2EUserContext } from './helpers/userContext';

const E2E_SUPER_ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

test.describe('Management admin-detail-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the admin-detail-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      testInfo,
      'User navigates to the management admin-detail-page while not logged in and is redirected to the login-page.',
      async () => {
        await page.goto(`/admin/${E2E_SUPER_ADMIN_ID}`);
      }
    );
  });
});
