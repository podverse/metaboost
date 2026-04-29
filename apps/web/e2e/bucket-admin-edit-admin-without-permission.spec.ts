import { test } from '@playwright/test';

import { loginAsWebE2EAdminWithoutPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';
const E2E_USER_ID_TEXT = 'e2eusr000001';

test.describe('Bucket-admin-edit-page for the bucket-admin (settings:- roles:- messages:- admins:-) user', () => {
  test('When the bucket-admin (settings:- roles:- messages:- admins:-) without bucket-admins permission opens the bucket-admin-edit-page, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin (settings:- roles:- messages:- admins:-)');
    await loginAsWebE2EAdminWithoutPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-admin-edit-page and sees not found (no bucket update permission).',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/admins/${E2E_USER_ID_TEXT}/edit`);
      }
    );
  });
});
