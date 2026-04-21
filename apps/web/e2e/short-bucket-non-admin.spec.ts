import { test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Short-bucket (public) URL is removed for the basic-user', () => {
  test('When the basic-user opens a short-bucket URL, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'Basic-user navigates to removed short-bucket URL and sees not found.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}`);
      }
    );
  });
});
