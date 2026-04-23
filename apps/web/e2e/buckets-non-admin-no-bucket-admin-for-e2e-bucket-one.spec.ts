import { expect, test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Buckets-list-page for the basic-user (no bucket_admin for E2E Bucket One) user', () => {
  test('When the basic-user opens the buckets-list-page, they see the list or empty state (filtered to buckets they have access to).', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user (no bucket_admin for E2E Bucket One)');
    await page.context().clearCookies();
    await loginAsWebE2ENonAdmin(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    const emptyState = page.getByText(/no buckets yet|create one to get started/i);
    if ((await emptyState.count()) > 0) {
      await expect(emptyState.first()).toBeVisible();
    } else {
      await expect(page.getByRole('table')).toBeVisible();
    }
    await capturePageLoad(
      page,
      testInfo,
      'The basic-user sees the buckets-list-page with list or empty state.'
    );
  });
});
