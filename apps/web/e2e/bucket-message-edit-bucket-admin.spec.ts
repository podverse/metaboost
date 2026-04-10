import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission } from './helpers/advancedFixtures';
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

test.describe('Bucket-message-edit-page for the bucket-admin user', () => {
  test('When the non-owner-admin with message update permission opens the bucket-message-edit-page for a valid message, they see the bucket-message-edit-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    const body = `e2e-admin-edit-${Date.now()}`;
    await createPublicMessage(page, body);
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages`);
    const editLink = page.getByRole('link', { name: /edit/i }).first();
    await expect(editLink).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks edit from the messages-list and reaches the bucket-message-edit-page.',
      async () => {
        await editLink.click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages/.+/edit$`));
    await expect(page.getByRole('textbox', { name: /message|body/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-message-edit-form is visible for the non-owner-admin with message update permission.'
    );
  });

  test('When the non-owner-admin with message update permission opens the bucket-message-edit-page for an invalid message id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-message-edit-page with an invalid message id and sees not found.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages/invalid-message-99999/edit`);
      }
    );
  });

  test('When the non-owner-admin with message update permission clicks Cancel on the bucket-message-edit-page, they are returned to bucket detail.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    const body = `e2e-admin-cancel-${Date.now()}`;
    await createPublicMessage(page, body);
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages`);
    const editLink = page.getByRole('link', { name: /edit/i }).first();
    await expect(editLink).toBeVisible();
    await editLink.click();
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages/.+/edit$`));
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on the bucket-message-edit-page and returns to bucket detail.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}$`));
    await capturePageLoad(page, testInfo, 'The bucket-detail-page is visible after Cancel.');
  });
});
