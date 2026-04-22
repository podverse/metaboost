import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('URL-state contracts for the management terms-versions-list page (sortBy, sortOrder, search)', () => {
  test('When the super-admin opens the terms-versions-list page with sortBy=versionKey and sortOrder=asc, the URL preserves the params and the terms versions heading is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the terms-versions-list page with sortBy=versionKey and sortOrder=asc and sees the URL and list content.',
      async () => {
        await page.goto('/terms-versions?sortBy=versionKey&sortOrder=asc');
        const url = new URL(page.url());
        expect(url.pathname).toBe('/terms-versions');
        expect(url.searchParams.get('sortBy')).toBe('versionKey');
        expect(url.searchParams.get('sortOrder')).toBe('asc');
        await expect(page.getByRole('heading', { name: /terms versions/i })).toBeVisible();
      }
    );
    const heading = page.getByRole('heading', { name: /terms versions/i });
    await capturePageLoad(
      page,
      testInfo,
      'The terms-versions-list page URL preserves sortBy and sortOrder and the list is visible.',
      heading
    );
  });

  test('When the super-admin opens the terms-versions-list page with a search that matches no terms versions, the URL preserves the search param and an empty-state message is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the terms-versions-list page with a no-match search and sees empty state.',
      async () => {
        await page.goto('/terms-versions?search=nomatchever123');
        const url = new URL(page.url());
        expect(url.pathname).toBe('/terms-versions');
        expect(url.searchParams.get('search')).toBe('nomatchever123');
        await expect(page.getByRole('heading', { name: /terms versions/i })).toBeVisible();
        const emptyState = page.getByText(/no terms versions|no results|no matches/i);
        await expect(emptyState.first()).toBeVisible();
      }
    );
    const emptyStateEl = page.getByText(/no terms versions|no results|no matches/i).first();
    await capturePageLoad(
      page,
      testInfo,
      'The terms-versions-list page shows empty state when search matches no terms versions.',
      emptyStateEl
    );
  });
});
