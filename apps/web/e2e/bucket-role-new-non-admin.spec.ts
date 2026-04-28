import { test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';

test.describe('Bucket-role-new-page for the basic-user', () => {
  test('When the basic-user opens the bucket-role-new-page, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-role-new-page and sees not found (no bucket access).',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/roles/new`);
      }
    );
  });
});
