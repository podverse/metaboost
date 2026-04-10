import { test } from '@playwright/test';

import { loginAsWebE2EAdminWithoutPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';
const NESTED_NEW_URL = `/bucket/${E2E_BUCKET1_SHORT_ID}/bucket/new`;

test.describe('Nested-bucket-create-page for the bucket-admin (bucket:R bucket_create:-) user', () => {
  test('When the bucket-admin (bucket:R bucket_create:-) without bucket create opens the nested-bucket-create-page, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin (bucket:R bucket_create:-)');
    await loginAsWebE2EAdminWithoutPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to nested-bucket-create route without create permission and sees not found.',
      async () => {
        await page.goto(NESTED_NEW_URL);
      }
    );
  });
});
