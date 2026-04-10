import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management events-page for the super-admin user', () => {
  test('When a permitted user (super-admin) opens the events-page, they see the events list or empty state.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management events-page and sees the list or empty state.',
      async () => {
        await page.goto('/events');
      }
    );
    await expect(page).toHaveURL(/\/events/);
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await capturePageLoad(page, testInfo, 'The events-page is visible with list or empty state.');
  });

  test('When the user opens the events-page with sort, search, and page query params, the params persist in the URL and the page shows the events table or empty state.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the events-page with sort, search, and page params; params persist and table or empty state is visible.',
      async () => {
        await page.goto('/events?sort=oldest&search=e2e&page=1');
      }
    );
    await expect(page).toHaveURL(/\/events\?/);
    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe('/events');
    expect(currentUrl.searchParams.get('search')).toBe('e2e');
    const pageParam = currentUrl.searchParams.get('page');
    if (pageParam !== null) {
      expect(pageParam).toBe('1');
    }
    const sort = currentUrl.searchParams.get('sort');
    const sortBy = currentUrl.searchParams.get('sortBy');
    const sortOrder = currentUrl.searchParams.get('sortOrder');
    if (sortBy === null && sortOrder === null) {
      expect(sort).toBe('oldest');
    } else {
      expect(sortBy).toBe('timestamp');
      expect(sortOrder).toBe('desc');
      if (sort !== null) {
        expect(sort).toBe('oldest');
      }
    }
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The events-page shows URL state and visible table or empty content.'
    );
  });
});
