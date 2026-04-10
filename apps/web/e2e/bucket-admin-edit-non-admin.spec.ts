import { test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';
const E2E_USER_SHORT_ID = 'e2eusr000001';

test.describe('Bucket-admin-edit-page for the basic-user', () => {
  test('When the basic-user opens the bucket-admin-edit-page, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-admin-edit-page and sees not found (no bucket admin row).',
      async () => {
        await page.goto(
          `/bucket/${E2E_BUCKET1_SHORT_ID}/settings/admins/${E2E_USER_SHORT_ID}/edit`
        );
      }
    );
  });
});
