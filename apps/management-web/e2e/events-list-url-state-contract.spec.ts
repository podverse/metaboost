import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('URL-state contracts for the management events-list page (sort, sortBy, sortOrder)', () => {
  test('When the super-admin opens the events-list page with sort=oldest and sortBy=timestamp and sortOrder=asc, the URL preserves the params and the events heading is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the events-list page with sort=oldest and sortBy=timestamp and sortOrder=asc and sees the URL and list content.',
      async () => {
        await page.goto('/events?sort=oldest&sortBy=timestamp&sortOrder=asc');
        const url = new URL(page.url());
        expect(url.pathname).toBe('/events');
        expect(url.searchParams.get('sort')).toBe('oldest');
        expect(url.searchParams.get('sortBy')).toBe('timestamp');
        expect(url.searchParams.get('sortOrder')).toBe('asc');
        await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
      }
    );
    const eventsHeading = page.getByRole('heading', { name: /events/i });
    await capturePageLoad(
      page,
      testInfo,
      'The events-list page URL preserves sort, sortBy, and sortOrder and the list is visible.',
      eventsHeading
    );
  });

  test('When the super-admin opens the events-list page with a search that matches no events, the URL preserves the search param and an empty-state message is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the events-list page with a no-match search and sees empty state.',
      async () => {
        await page.goto('/events?search=nomatchever123');
        const url = new URL(page.url());
        expect(url.pathname).toBe('/events');
        expect(url.searchParams.get('search')).toBe('nomatchever123');
        await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
        const emptyState = page.getByText(/no events|no results|no matches/i);
        await expect(emptyState.first()).toBeVisible();
      }
    );
    const emptyState = page.getByText(/no events|no results|no matches/i).first();
    await capturePageLoad(
      page,
      testInfo,
      'The events-list page shows empty state when search matches no events.',
      emptyState
    );
  });
});
