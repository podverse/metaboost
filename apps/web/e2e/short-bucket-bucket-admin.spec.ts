import { test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Short-bucket (public) URL is removed for bucket-admin user', () => {
  test('When the non-owner-admin with bucket access opens a short-bucket URL, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'Non-owner-admin navigates to removed short-bucket URL and sees not found.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}`);
      }
    );
  });
});
