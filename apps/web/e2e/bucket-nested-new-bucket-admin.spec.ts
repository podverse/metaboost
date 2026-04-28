import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';
const NESTED_NEW_URL = `/bucket/${E2E_BUCKET1_ID_TEXT}/bucket/new`;

test.describe('Nested-bucket-create-page for the bucket-admin user', () => {
  test('When the non-owner-admin with bucket permission opens the nested-bucket-create-page, they see the create form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(NESTED_NEW_URL);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/bucket/new`));
    await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add bucket|create|save/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The nested-bucket-create-form is visible for the non-owner-admin with bucket permission.'
    );
  });

  test('When the non-owner-admin opens the nested-bucket-create-page with an invalid parent bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the nested-bucket-create-page with an invalid parent bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/invalid-parent-99999/bucket/new');
      }
    );
  });

  test('When the non-owner-admin navigates from the bucket-detail-page (buckets-tab) to the nested-bucket-create-page, they see the create form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}?tab=buckets&skipEmptyRssNetworkRedirect=1`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}\\?tab=buckets`));
    await actionAndCapture(
      page,
      testInfo,
      'User navigates from the bucket-detail-page to the nested-bucket-create-page and the form loads.',
      async () => {
        await page.goto(NESTED_NEW_URL);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/bucket/new`));
    await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The nested-bucket-create-form is visible after navigating from the bucket-detail-page.'
    );
  });

  test('When the non-owner-admin clicks cancel on the nested-bucket-create-form, they are taken back to the bucket-detail-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(NESTED_NEW_URL);
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks cancel on the nested-bucket-create-form and returns to the bucket-detail-page.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}\\?tab=buckets`));
      }
    );
    await capturePageLoad(page, testInfo, 'The bucket-detail-page is visible after Cancel.');
  });
});
