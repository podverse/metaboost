import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Buckets-list-page for the bucket-admin user', () => {
  test('When the non-owner-admin with bucket permission opens the buckets-list-page, they see the list or empty state.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the buckets-list-page and sees the list or empty state.',
      async () => {
        await page.goto('/buckets');
        await expect(page).toHaveURL(/\/buckets/);
        await expect(
          page.getByRole('table').or(page.getByText(/no buckets yet|create one to get started/i))
        ).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list-page is visible for the non-owner-admin with bucket permission.'
    );
  });
});
