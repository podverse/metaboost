import { test } from '@playwright/test';

import { expectUnauthedRouteRedirectsToLogin } from './helpers/advancedFixtures';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';
const NESTED_NEW_URL = `/bucket/${E2E_BUCKET1_SHORT_ID}/bucket/new`;

test.describe('Nested-bucket-create-page for the unauthenticated user', () => {
  test('When an unauthenticated user tries to open the page to create a new nested bucket, they are redirected to the login-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectUnauthedRouteRedirectsToLogin(
      page,
      NESTED_NEW_URL,
      'User navigates to the nested-bucket-create-page while not logged in and is redirected to the login-page.',
      testInfo
    );
  });
});
