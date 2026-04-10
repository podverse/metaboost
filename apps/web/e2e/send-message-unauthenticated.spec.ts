import { expect, test } from '@playwright/test';

import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';
const E2E_BUCKET2_SHORT_ID = 'e2ebkt000002';

test.describe('Public send-message-page for the unauthenticated user', () => {
  test('When the user opens the public send-message-page for a public bucket, they see the destination URL and the send-message form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the public send-message URL and sees the destination URL and form.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`);
        await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`));
        await expect(page.getByRole('heading', { name: /send a message/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /your name/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /message/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /send|submit/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The public send-message-page shows the form with name, message, and submit button.'
    );
  });

  test('When the user opens the send-message-page with an invalid short id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to send-message with an invalid short id and sees not found.',
      async () => {
        await page.goto('/b/invalid-short-99999/send-message');
      }
    );
  });

  test('When the user opens the send-message-page for a private bucket, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to send-message for a private bucket and sees not found.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET2_SHORT_ID}/send-message`);
      }
    );
  });

  test('When the send-message form is empty, the submit button stays disabled until required fields are filled.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`);
    await expect(page.getByRole('textbox', { name: /your name/i })).toBeVisible();
    const submitButton = page.getByRole('button', { name: /send|submit/i });
    await expect(submitButton).toBeDisabled();
    await actionAndCapture(
      page,
      testInfo,
      'User fills the required send-message fields and the submit button becomes enabled.',
      async () => {
        await page.getByRole('textbox', { name: /your name/i }).fill('E2E Sender');
        await page.getByRole('textbox', { name: /message/i }).fill('E2E public message body');
        await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`));
        await expect(submitButton).toBeEnabled();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The send-message form shows submit enabled after required fields are filled.'
    );
  });

  test('When the user submits a valid send-message form, they are redirected back to the public bucket page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`);
    await expect(page.getByRole('textbox', { name: /your name/i })).toBeVisible();
    await page.getByRole('textbox', { name: /your name/i }).fill('E2E Sender');
    await page.getByRole('textbox', { name: /message/i }).fill('E2E public message body');

    await actionAndCapture(
      page,
      testInfo,
      'User submits the valid send-message form and is redirected to the public bucket page.',
      async () => {
        await page.getByRole('button', { name: /send|submit/i }).click();
        await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}$`));
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The public bucket page is visible after successful send-message submit.'
    );
  });

  test('When the user navigates from the public bucket page to the send-message-page via the submit link, they see the send-message form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}`);
    await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}`));
    const sendMessageLink = page.getByRole('link', { name: /submit a message|send message/i });
    await expect(sendMessageLink.first()).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the submit-message link on the public bucket page and reaches the send-message-page.',
      async () => {
        await sendMessageLink.first().click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`));
    await expect(page.getByRole('heading', { name: /send a message/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /your name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send|submit/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The send-message-page form is visible after navigating from the public bucket page.'
    );
  });
});
