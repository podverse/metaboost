import { test, expect } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Membership billing page for the super-admin user', () => {
  test('When the super-admin opens membership billing, the page shows governance sections for resolved membership pricing and price windows.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await actionAndCapture(
      page,
      testInfo,
      'User logs in as the seeded super-admin identity and navigates to the membership billing governance page.',
      async () => {
        await loginAsManagementSuperAdmin(page);
        await page.goto('/products/membership');
        await expect(page.getByRole('heading', { name: /membership billing/i })).toBeVisible();
        await expect(page.getByText(/resolved membership pricing/i)).toBeVisible();
        await expect(page.getByText(/price windows/i)).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The membership billing page remains visible with primary governance sections after navigation.'
    );
  });
});
