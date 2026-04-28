import { test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';

test.describe('Short-bucket (public) URL is removed for bucket-owner user', () => {
  test('When an authenticated user opens a short-bucket URL, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'Authenticated user navigates to removed short-bucket URL and sees not found.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_ID_TEXT}`);
      }
    );
  });
});
