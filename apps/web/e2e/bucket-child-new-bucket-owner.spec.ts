import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';
const E2E_RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-03.xml';

test.describe('Child-bucket-create-page for the bucket-owner user', () => {
  test('When an authenticated user opens the page to create a new child bucket, they see the create form with an RSS feed URL field and a submit button.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the child-bucket-create-route and the child-bucket-create-form page loads.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/new`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/new`));
        await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /add bucket|create|save/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The child-bucket-create-form is visible with the RSS feed URL input and the add-bucket submit button.'
    );
  });

  test('When the user submits the child bucket form without entering an RSS feed URL, validation is shown and they remain on the create page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/new`);
    await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User submits the child-bucket form without filling in the RSS feed URL field and sees validation.',
      async () => {
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/new`));
        await expect(page.getByText(/required|rss feed url/i).first()).toBeVisible();
      }
    );
  });

  test('When the user clicks cancel on the child-bucket-create-form, they are taken back to the bucket-detail-page (buckets-tab).', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/new`);
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks cancel on the child-bucket-create-form and returns to the bucket-detail-page.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}(\\?tab=buckets)?$`)
        );
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-detail-page (buckets-tab) is visible after Cancel.'
    );
  });

  test('When the user fills in an RSS feed URL and submits the child-bucket form, they are redirected to the new RSS channel add-to-rss tab.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/new`);
    await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();
    await page.getByRole('textbox', { name: /rss feed url/i }).fill(E2E_RSS_FEED_URL);

    await actionAndCapture(
      page,
      testInfo,
      'User submits the child-bucket form with a valid RSS feed URL and is redirected to the new RSS channel add-to-rss tab.',
      async () => {
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
        await expect(page).toHaveURL(/\/bucket\/[^/?]+(\?tab=add-to-rss)?$/);
        await expect(page.getByRole('link', { name: /add to rss/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The new RSS channel bucket detail page is visible on the add-to-rss tab after create.'
    );
  });

  test('When the owner navigates from the bucket-detail-page (buckets-tab) to the child-bucket-create-page, they see the child-bucket-create-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}?tab=buckets`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}(\\?tab=buckets)?`));
    const addBucketLink = page.getByRole('link', { name: /add bucket|new bucket/i });
    await expect(addBucketLink.first()).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the add-bucket link from the bucket-detail-page buckets-tab and reaches the child-bucket-create-page.',
      async () => {
        await addBucketLink.first().click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/new`));
    await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add bucket|create|save/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The child-bucket-create-form is visible after navigating from the bucket-detail-page.'
    );
  });

  test('When the user opens the child-bucket-create-page with an invalid parent bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the child-bucket-create-page with an invalid parent bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/invalid-parent-99999/new');
      }
    );
  });
});
