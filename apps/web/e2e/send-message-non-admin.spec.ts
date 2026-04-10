import { expect, test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';
const E2E_BUCKET2_SHORT_ID = 'e2ebkt000002';

test.describe('Public send-message-page for the basic-user', () => {
  test('When the basic-user opens the public send-message-page for a public bucket, they see the send-message form (public bucket).', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the public send-message URL and sees the form.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`);
        await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`));
        await expect(page.getByRole('heading', { name: /send a message/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /your name/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /send|submit/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The public send-message-page shows the form for the basic-user (public bucket).'
    );
  });

  test('When the basic-user opens the send-message-page with an invalid short id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to send-message with an invalid short id and sees not found.',
      async () => {
        await page.goto('/b/invalid-short-99999/send-message');
      }
    );
  });

  test('When the basic-user opens the send-message-page for a private bucket, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to send-message for a private bucket and sees not found.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET2_SHORT_ID}/send-message`);
      }
    );
  });
});
