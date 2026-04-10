import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Bucket-detail-page for the bucket-admin user', () => {
  test('When the non-owner-admin with bucket access opens the bucket-detail-page, they see the bucket name and content.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}`));
    await expect(page.getByText('E2E Bucket One')).toBeVisible();
    await expect(page.getByRole('link', { name: /messages/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail-page shows bucket name and settings/messages links for the non-owner-admin.'
    );
  });

  test('When the non-owner-admin opens the bucket-detail-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-detail-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/nonexistent-bucket-id-99999');
      }
    );
  });

  test('When the non-owner-admin navigates from the buckets list to the seeded bucket, they see the bucket detail.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates from the buckets list to the seeded bucket and sees the bucket detail.',
      async () => {
        await page.goto('/buckets');
        await expect(page).toHaveURL(/\/buckets/);
        await page.getByRole('link', { name: 'E2E Bucket One' }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}`));
        await expect(page.getByText('E2E Bucket One')).toBeVisible();
        await expect(page.getByRole('link', { name: /messages/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail page is visible after navigating from the buckets list.'
    );
  });
});
