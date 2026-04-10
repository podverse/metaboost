import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('URL-state contracts for the bucket-detail-page (tab, sortBy, sortOrder)', () => {
  test('When the user opens the bucket-detail-page with tab=buckets and sortBy=name and sortOrder=asc, the URL preserves the params and the buckets-tab content is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-detail-page with tab=buckets and sortBy=name and sortOrder=asc and sees the URL and buckets-tab content.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}?tab=buckets&sortBy=name&sortOrder=asc`);
        const url = new URL(page.url());
        expect(url.pathname).toBe(`/bucket/${E2E_BUCKET1_SHORT_ID}`);
        expect(url.searchParams.get('tab')).toBe('buckets');
        expect(url.searchParams.get('sortBy')).toBe('name');
        expect(url.searchParams.get('sortOrder')).toBe('asc');
        await expect(page.getByText('E2E Bucket One')).toBeVisible();
        await expect(page.getByRole('link', { name: /buckets/i }).first()).toBeVisible();
      }
    );
    const bucketTitle = page.getByText('E2E Bucket One');
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail-page URL preserves tab, sortBy, and sortOrder and the buckets-tab is available.',
      bucketTitle
    );
  });

  test('When the user opens the bucket-detail-page with tab=buckets and sortBy=created and sortOrder=desc, the URL preserves the params.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-detail-page with tab=buckets and sortBy=created and sortOrder=desc and sees the URL preserved.',
      async () => {
        await page.goto(
          `/bucket/${E2E_BUCKET1_SHORT_ID}?tab=buckets&sortBy=created&sortOrder=desc`
        );
        const url = new URL(page.url());
        expect(url.pathname).toBe(`/bucket/${E2E_BUCKET1_SHORT_ID}`);
        expect(url.searchParams.get('tab')).toBe('buckets');
        expect(url.searchParams.get('sortBy')).toBe('created');
        expect(url.searchParams.get('sortOrder')).toBe('desc');
        await expect(page.getByText('E2E Bucket One')).toBeVisible();
      }
    );
    const bucketTitle = page.getByText('E2E Bucket One');
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail-page URL preserves sortBy=created and sortOrder=desc.',
      bucketTitle
    );
  });
});
