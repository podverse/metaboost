import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/authAssertions';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-child-new-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the bucket-child-new page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      testInfo,
      'User navigates to the management bucket-child-new page while not logged in and is redirected to the login-page.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/new`);
      }
    );
  });
});
