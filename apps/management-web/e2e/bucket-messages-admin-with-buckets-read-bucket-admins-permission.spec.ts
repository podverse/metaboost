import { expect, test } from '@playwright/test';

import { loginAsManagementAdminWithBucketAdmins } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-messages-page for the admin (buckets:R bucket_admins events:all_admins) user', () => {
  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-messages route with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-messages route with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/99999999-9999-4999-a999-999999999999/messages');
      }
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) opens the bucket-messages route, they are redirected to the bucket-detail-page without messages access.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/messages`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}(?:/|$)`));
    await expect(page.getByRole('link', { name: /messages/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /buckets/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admin (buckets:R bucket_admins events:all_admins) is redirected to bucket-detail without messages tab access.'
    );
  });

  test('When an admin (buckets:R bucket_admins events:all_admins) opens bucket-detail with tab=messages, they remain on bucket-detail without messages content.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (buckets:R bucket_admins events:all_admins)');
    await loginAsManagementAdminWithBucketAdmins(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to bucket-detail with tab=messages and is shown bucket-detail without messages access.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}?tab=messages`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}`));
    await expect(page.getByRole('link', { name: /messages/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /buckets/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'Bucket detail is visible and message content is not accessible for this admin role.'
    );
  });
});
