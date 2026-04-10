import { expect, test } from '@playwright/test';

import {
  loginAsManagementAdminWithoutBucketAdmins,
  loginAsManagementSuperAdmin,
} from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management events-page for the admin (buckets:R events:all_admins) user', () => {
  test('When an admin (buckets:R events:all_admins) opens the events-page, only admin actor events are shown.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R events:all_admins)');
    await loginAsManagementSuperAdmin(page);
    await page.context().clearCookies();
    await loginAsManagementAdminWithoutBucketAdmins(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the events page and sees admin actor events without super-admin actor events.',
      async () => {
        await page.goto('/events');
      }
    );
    await expect(page).toHaveURL(/\/events/);
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(/E2E Admin No Bucket Admins/i)).toBeVisible();
    await expect(page.getByText(/E2E Super Admin/i)).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'The events page is visible with admin actor events and without super-admin events.'
    );
  });
});
