import { expect, test } from '@playwright/test';

import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management terms-versions-page unauthenticated behavior', () => {
  test('When an unauthenticated user opens terms-version management routes, they are redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');

    await page.goto('/terms-versions');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/terms-versions/new');
    await expect(page).toHaveURL(/\/login/);

    await capturePageLoad(
      page,
      testInfo,
      'The unauthenticated user is redirected to the login page from terms-version management routes.'
    );
  });
});
