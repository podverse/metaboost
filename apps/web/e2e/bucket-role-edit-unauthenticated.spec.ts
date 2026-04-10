import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/advancedFixtures';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Bucket-role-edit-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the bucket-role-edit-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      `/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/invalid-role-99999/edit`,
      'User navigates to the bucket-role-edit-page while not logged in and is redirected to the login-page.',
      testInfo
    );
  });
});
