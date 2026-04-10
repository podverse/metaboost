import { expect, test } from '@playwright/test';

import { loginAsLimitedAdmin } from './helpers/advancedFixtures';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management buckets-list page for the admin (admins users events:own) user', () => {
  test('When an admin (admins users events:own) opens the buckets-list route, they are redirected to the dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await page.goto('/buckets');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admin (admins users events:own) is redirected to the dashboard when visiting the buckets route.'
    );
  });
});
