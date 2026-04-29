import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';

test.describe('Bucket-messages-page for the bucket-admin user', () => {
  test('When the non-owner-admin with bucket access opens the bucket-messages-page, they see the messages-list or empty state.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/messages`);
    await expect
      .poll(() => {
        const url = new URL(page.url());
        return (
          url.pathname === `/bucket/${E2E_BUCKET1_ID_TEXT}/messages` ||
          url.pathname === `/bucket/${E2E_BUCKET1_ID_TEXT}`
        );
      })
      .toBe(true);
    await expect(page.getByRole('heading', { name: /messages/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-messages-page is visible with messages-list or empty state for the non-owner-admin.'
    );
  });

  test('When the non-owner-admin opens the bucket-messages-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-messages-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/nonexistent-bucket-id-99999/messages');
      }
    );
  });

  test('When the non-owner-admin navigates from bucket-detail to the messages link, they see the messages page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates from bucket-detail to the messages link and sees the messages page.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}`));
        await page.getByRole('link', { name: /messages/i }).click();
        await expect
          .poll(() => {
            const url = new URL(page.url());
            return (
              url.pathname === `/bucket/${E2E_BUCKET1_ID_TEXT}/messages` ||
              url.pathname === `/bucket/${E2E_BUCKET1_ID_TEXT}`
            );
          })
          .toBe(true);
        await expect(page.getByRole('heading', { name: /messages/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The messages page is visible after navigating from bucket detail.'
    );
  });
});
