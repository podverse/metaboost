import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Bucket-messages-page for the bucket-owner user', () => {
  test('When an authenticated user opens the bucket-messages-page, they see the messages-list or empty state.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-messages-page and sees the messages-list or empty state.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages`);
        await expect
          .poll(() => {
            const url = new URL(page.url());
            return (
              url.pathname === `/bucket/${E2E_BUCKET1_SHORT_ID}/messages` ||
              url.pathname === `/bucket/${E2E_BUCKET1_SHORT_ID}`
            );
          })
          .toBe(true);
        await expect(page.getByRole('heading', { name: /messages/i })).toBeVisible();
      }
    );
    const messagesHeading = page.getByRole('heading', { name: /messages/i });
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-messages-page is visible with a messages-list or empty state.',
      messagesHeading
    );
  });

  test('When the user opens the bucket-messages-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-messages-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/nonexistent-bucket-id-99999/messages');
      }
    );
  });

  test('When the user navigates from bucket-detail to the messages link, they see the messages page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates from bucket-detail to the messages link and sees the messages page.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}`));
        await page.getByRole('link', { name: /messages/i }).click();
        await expect
          .poll(() => {
            const url = new URL(page.url());
            return (
              url.pathname === `/bucket/${E2E_BUCKET1_SHORT_ID}/messages` ||
              url.pathname === `/bucket/${E2E_BUCKET1_SHORT_ID}`
            );
          })
          .toBe(true);
        await expect(page.getByRole('heading', { name: /messages/i })).toBeVisible();
      }
    );
    const messagesHeading = page.getByRole('heading', { name: /messages/i });
    await capturePageLoad(
      page,
      testInfo,
      'The messages page is visible after navigating from bucket detail.',
      messagesHeading
    );
  });
});
