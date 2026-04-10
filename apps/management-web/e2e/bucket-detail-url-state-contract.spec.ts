import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

/** UUID from tools/web/seed-e2e.mjs E2E_BUCKET1_ID (main DB; management E2E runs after full seed). */
const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('URL-state contracts for the management bucket-detail-page (tab, sortBy, sortOrder)', () => {
  test('When the super-admin opens the bucket-detail-page with tab=buckets and sortBy=name and sortOrder=asc, the URL preserves the params and the buckets-tab content is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management bucket-detail-page with tab=buckets and sortBy=name and sortOrder=asc and sees the URL and buckets-tab content.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}?tab=buckets&sortBy=name&sortOrder=asc`);
        const url = new URL(page.url());
        expect(url.pathname).toBe(`/bucket/${E2E_BUCKET1_ID}`);
        expect(url.searchParams.get('tab')).toBe('buckets');
        expect(url.searchParams.get('sortBy')).toBe('name');
        expect(url.searchParams.get('sortOrder')).toBe('asc');
        await expect(page.getByText(/E2E Bucket One/)).toBeVisible();
        await expect(page.getByRole('link', { name: /buckets/i }).first()).toBeVisible();
      }
    );
    const bucketTitle = page.getByText(/E2E Bucket One/);
    await capturePageLoad(
      page,
      testInfo,
      'The management bucket-detail-page URL preserves tab, sortBy, and sortOrder and the buckets-tab is available.',
      bucketTitle
    );
  });

  test('When the super-admin opens the bucket-detail-page with tab=messages and sort=oldest, the URL preserves the params.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management bucket-detail-page with tab=messages and sort=oldest and sees the URL preserved.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}?tab=messages&sort=oldest`);
        const url = new URL(page.url());
        expect(url.pathname).toBe(`/bucket/${E2E_BUCKET1_ID}`);
        expect(url.searchParams.get('tab')).toBe('messages');
        expect(url.searchParams.get('sort')).toBe('oldest');
        await expect(page.getByText(/E2E Bucket One/)).toBeVisible();
      }
    );
    const bucketTitle = page.getByText(/E2E Bucket One/);
    await capturePageLoad(
      page,
      testInfo,
      'The management bucket-detail-page URL preserves tab=messages and sort=oldest.',
      bucketTitle
    );
  });
});
