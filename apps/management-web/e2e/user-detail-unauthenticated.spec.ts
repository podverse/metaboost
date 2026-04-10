import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/authAssertions';
import { setE2EUserContext } from './helpers/userContext';

const E2E_MAIN_USER_ID = '11111111-1111-4111-a111-111111111111';

test.describe('Management user-detail-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the user-detail-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      testInfo,
      'User navigates to the management user-detail-page while not logged in and is redirected to the login-page.',
      async () => {
        await page.goto(`/user/${E2E_MAIN_USER_ID}`);
      }
    );
  });
});
