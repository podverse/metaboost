import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('URL-state contracts for the management buckets-list page (sortBy, sortOrder)', () => {
  test('When the super-admin opens the buckets-list page with sortBy=name and sortOrder=asc, the URL preserves the params and the buckets heading is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the buckets-list page with sortBy=name and sortOrder=asc and sees the URL and list content.',
      async () => {
        await page.goto('/buckets?sortBy=name&sortOrder=asc');
        const url = new URL(page.url());
        expect(url.pathname).toBe('/buckets');
        expect(url.searchParams.get('sortBy')).toBe('name');
        expect(url.searchParams.get('sortOrder')).toBe('asc');
        await expect(page.getByRole('heading', { name: /buckets/i })).toBeVisible();
      }
    );
    const bucketsHeading = page.getByRole('heading', { name: /buckets/i });
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list page URL preserves sortBy and sortOrder and the list is visible.',
      bucketsHeading
    );
  });
});
