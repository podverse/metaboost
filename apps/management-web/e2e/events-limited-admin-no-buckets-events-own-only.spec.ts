import { expect, test } from '@playwright/test';

import {
  loginAsLimitedAdmin,
  loginAsManagementAdminWithBucketAdmins,
} from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management events-page for the admin (admins users events:own) user', () => {
  test('When an admin (admins users events:own) opens the events-page, they see the events heading and list or empty state.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.context().clearCookies();
    await loginAsLimitedAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management events-page as admin (admins users events:own) and sees the list or empty state.',
      async () => {
        await page.goto('/events');
      }
    );
    await expect(page).toHaveURL(/\/events/);
    const eventsHeading = page.getByRole('heading', { name: /events/i });
    await expect(eventsHeading).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(/E2E Limited Admin/i)).toBeVisible();
    await expect(page.getByText(/E2E Admin Bucket Admins/i)).toHaveCount(0);
    await expect(page.getByText(/E2E Super Admin/i)).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'The events-page is visible for admin (admins users events:own) with list or empty state.',
      eventsHeading
    );
  });
});
