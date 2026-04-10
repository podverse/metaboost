import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/advancedFixtures';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Bucket-messages-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the bucket-messages-page, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      `/bucket/${E2E_BUCKET1_SHORT_ID}/messages`,
      'User navigates to the bucket-messages-page while not logged in and is redirected to the login-page.',
      testInfo
    );
  });
});
