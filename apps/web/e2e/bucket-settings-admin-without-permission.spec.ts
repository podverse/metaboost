import { test } from '@playwright/test';

import { loginAsWebE2EAdminWithoutPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Bucket-settings-page for the bucket-admin (settings:- roles:- messages:- admins:-) user', () => {
  test('When the bucket-admin (settings:- roles:- messages:- admins:-) without bucket update permission opens the bucket-settings-page, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin (settings:- roles:- messages:- admins:-)');
    await loginAsWebE2EAdminWithoutPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-settings-page and sees not found (no bucket update permission).',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings`);
      }
    );
  });
});
