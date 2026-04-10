import { test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Bucket-settings-page for the basic-user', () => {
  test('When the basic-user opens the bucket-settings-page, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-settings-page and sees not found (no bucket access).',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings`);
      }
    );
  });
});
