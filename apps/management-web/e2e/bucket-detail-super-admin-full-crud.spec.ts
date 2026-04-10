import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

/** UUID from tools/web/seed-e2e.mjs E2E_BUCKET1_ID (main DB; management E2E runs after full seed). */
const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-detail-page for the super-admin user', () => {
  test('When the super-admin opens the bucket-detail-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-detail-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/99999999-9999-4999-a999-999999999999');
      }
    );
  });

  test('When a permitted user (super-admin) opens the bucket-detail-page, they see the bucket name and the Messages, Buckets, and Settings tab links.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management bucket-detail-page and sees the bucket name and Messages, Buckets, and Settings tabs.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}`));
    await expect(page.getByText(/E2E Bucket One/)).toBeVisible();
    await expect(page.getByRole('link', { name: /messages/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /buckets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail-page is visible with bucket name and Messages, Buckets, and Settings tab links.'
    );
  });
});
