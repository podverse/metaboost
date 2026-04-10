import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/authAssertions';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';
const E2E_MAIN_USER_ID = '11111111-1111-4111-a111-111111111111';

test.describe('Management bucket-admin-edit-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the bucket-admin-edit-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      testInfo,
      'User navigates to the management bucket-admin-edit-page while not logged in and is redirected to the login-page.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/admins/${E2E_MAIN_USER_ID}/edit`);
      }
    );
  });
});
