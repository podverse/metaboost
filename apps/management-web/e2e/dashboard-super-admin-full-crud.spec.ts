import { test, expect } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management dashboard-page for the super-admin user', () => {
  test('When the user logs in with the super-admin account, the dashboard-page loads and shows the dashboard heading.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await actionAndCapture(
      page,
      testInfo,
      'User logs in with the seeded super-admin identity and is transitioned to the dashboard after successful authentication.',
      async () => {
        await loginAsManagementSuperAdmin(page);
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management dashboard-page is visible with the primary heading after successful login.'
    );
  });
});
