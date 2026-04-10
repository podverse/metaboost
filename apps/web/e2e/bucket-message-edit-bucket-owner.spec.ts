import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

async function createPublicMessage(page: import('@playwright/test').Page, body: string) {
  await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`);
  await expect(page.getByRole('textbox', { name: /your name/i })).toBeVisible();
  await page.getByRole('textbox', { name: /your name/i }).fill('E2E Sender');
  await page.getByRole('textbox', { name: /message/i }).fill(body);
  await page.getByRole('button', { name: /send|submit/i }).click();
  await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}$`));
}

test.describe('Bucket-message-edit-page for the bucket-owner user', () => {
  test('When the user opens the bucket-message-edit-page with an invalid message id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-message-edit-page with an invalid message id and sees not found.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages/invalid-message-99999/edit`);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-message-edit-page with an invalid message id renders not found.'
    );
  });

  test('When the user edits an existing message and saves, the message is updated and they return to bucket detail.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    const originalBody = `e2e-edit-message-original-${Date.now()}`;
    const updatedBody = `e2e-edit-message-updated-${Date.now()}`.slice(0, 48);
    await createPublicMessage(page, originalBody);
    await loginAsWebE2EUserAndExpectDashboard(page);

    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages`);
    const editLink = page.getByRole('link', { name: /edit/i }).first();
    await expect(editLink).toBeVisible();
    await editLink.click();

    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages/.+/edit$`));
    const bodyField = page.getByRole('textbox', { name: /message|body/i });
    await expect(bodyField).toBeVisible();
    await bodyField.fill(updatedBody);

    await actionAndCapture(
      page,
      testInfo,
      'User saves the edited bucket message and is returned to bucket detail.',
      async () => {
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}$`));
      }
    );
    await capturePageLoad(page, testInfo, 'The bucket-detail-page is visible after Save.');
  });

  test('When the user clicks cancel on the bucket-message-edit-page, they are returned to bucket detail.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    const originalBody = `e2e-cancel-message-${Date.now()}`;
    await createPublicMessage(page, originalBody);
    await loginAsWebE2EUserAndExpectDashboard(page);

    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages`);
    const editLink = page.getByRole('link', { name: /edit/i }).first();
    await expect(editLink).toBeVisible();
    await editLink.click();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks cancel on the bucket-message-edit-form and is returned to bucket detail.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}$`));
      }
    );
    await capturePageLoad(page, testInfo, 'The bucket-detail-page is visible after Cancel.');
  });
});
