import { expect, test } from '@playwright/test';

import { loginAsLimitedAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management dashboard-page for the admin (admins users events:own) user', () => {
  test('When an admin (admins users events:own) opens the dashboard-page, they see the dashboard heading.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to dashboard and sees the dashboard heading.',
      async () => {
        await page.goto('/dashboard');
      }
    );
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The dashboard-page is visible for admin (admins users events:own).'
    );
  });
});
