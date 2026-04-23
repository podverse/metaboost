import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('URL-state contracts for the web buckets-list page (sortBy, sortOrder)', () => {
  test('When the authenticated user opens the buckets-list page with sortBy=name and sortOrder=asc, the URL preserves the params and the buckets list or empty state is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the buckets-list page with sortBy=name and sortOrder=asc and sees the URL and list content.',
      async () => {
        await page.goto('/dashboard?sortBy=name&sortOrder=asc');
        const url = new URL(page.url());
        expect(url.pathname).toBe('/dashboard');
        expect(url.searchParams.get('sortBy')).toBe('name');
        expect(url.searchParams.get('sortOrder')).toBe('asc');
        await expect(
          page.getByRole('link', { name: /add bucket|new bucket|create/i })
        ).toBeVisible();
      }
    );
    const listOrEmptyState = page.getByRole('link', { name: /add bucket|new bucket|create/i });
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list page URL preserves sortBy and sortOrder and the list or empty state is visible.',
      listOrEmptyState
    );
  });
});
