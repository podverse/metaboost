import { expect, test } from '@playwright/test';

import { loginAsLimitedAdmin } from './helpers/advancedFixtures';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-messages-page for the admin (admins users events:own) user', () => {
  test('When a admin (admins users events:own) opens the bucket-messages route, they are redirected to the dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/messages`);
    await expect(page).toHaveURL(/\/dashboard/);
    await capturePageLoad(
      page,
      testInfo,
      'The admin (admins users events:own) is redirected to the dashboard when opening the bucket-messages route.'
    );
  });
});
