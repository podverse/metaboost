import { expect, test } from '@playwright/test';

import {
  createBucketMessageFixture,
  getCookieHeaderFromPage,
  loginAsManagementSuperAdmin,
} from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-message-edit-page for the super-admin user', () => {
  test('When the super-admin opens the bucket-message-edit-page with an invalid message id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-message-edit-page with an invalid message id and sees not found.',
      async () => {
        await page.goto(
          `/bucket/${E2E_BUCKET1_ID}/messages/99999999-9999-4999-a999-999999999999/edit`
        );
      }
    );
  });

  test('When a permitted user (super-admin) opens the bucket-message-edit-page, they see the message-edit form.', async ({
    page,
    request,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    const cookieHeader = await getCookieHeaderFromPage(page);
    const { id: messageId } = await createBucketMessageFixture(
      request,
      E2E_BUCKET1_ID,
      { body: 'E2E message for edit', senderName: 'E2E Sender' },
      { cookieHeader }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-message-edit-page and sees the message-edit form.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/messages/${messageId}/edit`);
      }
    );
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_ID}/messages/${messageId}/edit`)
    );
    await expect(page.getByRole('textbox', { name: /body|message/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save|save changes/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-message-edit form is visible with body and save button.'
    );
  });

  test('When the super-admin navigates from the bucket-view messages-tab to the message-edit-page via the edit link, they see the message-edit form.', async ({
    page,
    request,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    const cookieHeader = await getCookieHeaderFromPage(page);
    const { id: messageId } = await createBucketMessageFixture(
      request,
      E2E_BUCKET1_ID,
      { body: 'E2E message for list-edit flow', senderName: 'E2E Sender' },
      { cookieHeader }
    );

    await page.goto(`/bucket/${E2E_BUCKET1_ID}?tab=messages`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}`));
    const editLink = page.locator(`a[href*="/messages/${messageId}/edit"]`).first();
    await expect(editLink).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks the edit link for the message and is taken to the message-edit-page.',
      async () => {
        await editLink.click();
      }
    );
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_ID}/messages/${messageId}/edit`)
    );
    await expect(page.getByRole('textbox', { name: /body|message/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-message-edit form is visible after list→edit.'
    );
  });

  test('When the user clicks Cancel on the message-edit form, they are returned to the bucket-view page.', async ({
    page,
    request,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    const cookieHeader = await getCookieHeaderFromPage(page);
    const { id: messageId } = await createBucketMessageFixture(
      request,
      E2E_BUCKET1_ID,
      { body: 'E2E message for Cancel flow', senderName: 'E2E Sender' },
      { cookieHeader }
    );

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/messages/${messageId}/edit`);
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel and is returned to the bucket-view page.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}(?:/|$)`));
      }
    );
    await capturePageLoad(page, testInfo, 'The bucket-view page is visible after Cancel.');
  });

  test('When the user edits the message body and saves, they are taken to the bucket-view page and the updated body is visible on the messages tab.', async ({
    page,
    request,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    const cookieHeader = await getCookieHeaderFromPage(page);
    const { id: messageId } = await createBucketMessageFixture(
      request,
      E2E_BUCKET1_ID,
      { body: 'Original E2E message body', senderName: 'E2E Sender' },
      { cookieHeader }
    );

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/messages/${messageId}/edit`);
    const bodyInput = page.getByRole('textbox', { name: /body|message/i });
    await expect(bodyInput).toBeVisible();
    const updatedBody = `Updated E2E message body ${Date.now()}`;
    await bodyInput.fill(updatedBody);

    await actionAndCapture(
      page,
      testInfo,
      'User saves the updated message and is taken to the bucket-view page.',
      async () => {
        await page.getByRole('button', { name: /save changes|save/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}(?:/|$)`));
      }
    );

    await page.goto(`/bucket/${E2E_BUCKET1_ID}?tab=messages`);
    await expect(page.getByText(updatedBody).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-view messages-tab shows the updated message body after save.'
    );
  });
});
