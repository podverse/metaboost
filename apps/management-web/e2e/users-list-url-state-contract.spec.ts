import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('URL-state contracts for the management users-list page (sortBy, sortOrder)', () => {
  test('When the super-admin opens the users-list page with sortBy=email and sortOrder=asc, the URL preserves the params and the users heading is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the users-list page with sortBy=email and sortOrder=asc and sees the URL and list content.',
      async () => {
        await page.goto('/users?sortBy=email&sortOrder=asc');
        const url = new URL(page.url());
        expect(url.pathname).toBe('/users');
        expect(url.searchParams.get('sortBy')).toBe('email');
        expect(url.searchParams.get('sortOrder')).toBe('asc');
        await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
      }
    );
    const usersHeading = page.getByRole('heading', { name: /users/i });
    await capturePageLoad(
      page,
      testInfo,
      'The users-list page URL preserves sortBy and sortOrder and the list is visible.',
      usersHeading
    );
  });

  test('When the super-admin opens the users-list page with a search that matches no users, the URL preserves the search param and an empty-state message or empty result is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the users-list page with a no-match search and sees empty state or empty result.',
      async () => {
        await page.goto('/users?search=nomatchever123');
        const url = new URL(page.url());
        expect(url.pathname).toBe('/users');
        expect(url.searchParams.get('search')).toBe('nomatchever123');
        await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
        const emptyState = page.getByText(
          /no users|no results|no matches|create one to get started|add user/i
        );
        await expect(emptyState.first()).toBeVisible();
      }
    );
    const emptyStateEl = page
      .getByText(/no users|no results|no matches|create one to get started|add user/i)
      .first();
    await capturePageLoad(
      page,
      testInfo,
      'The users-list page shows empty state when search matches no users.',
      emptyStateEl
    );
  });
});
