import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = 'e2ebkt000001';

test.describe('Management bucket-edit-page for the super-admin user', () => {
  test('When the super-admin opens the bucket-edit-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-edit-page with an invalid bucket id and is redirected to settings which shows not found.',
      async () => {
        await page.goto('/bucket/99999999-9999-4999-a999-999999999999/edit');
      }
    );
  });

  test('When a permitted user (super-admin) opens the bucket-edit-page, they are redirected to the bucket-settings-page and see the bucket-edit-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-edit-route and is redirected to settings with the bucket form visible.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/edit`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings`));
        await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /save|update/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-settings-page (general tab) shows the bucket-edit-form after redirect from bucket-edit.'
    );
  });

  test('When the super-admin navigates from the buckets-list-page to the bucket-edit-page via the edit link, they are redirected to the bucket-settings-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/buckets');
    await expect(page).toHaveURL(/\/buckets/);
    const editLink = page.locator(`a[href*="/bucket/${E2E_BUCKET1_ID}/edit"]`).first();
    await expect(editLink).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the edit link on the buckets-list-page and is taken to the bucket-settings-page.',
      async () => {
        await editLink.click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings`));
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();
    await capturePageLoad(page, testInfo, 'The bucket-settings-page is visible after list→edit.');
  });

  test('When the user clicks Cancel on the bucket-edit-form, they are returned to the bucket-view (detail) page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/edit`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings`));
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on the bucket-edit-form and is returned to the bucket-view page.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}(?:/|$)`));
      }
    );
    await capturePageLoad(page, testInfo, 'The bucket-view page is visible after Cancel.');
  });

  test('When the user edits the bucket name and saves, they are taken to the bucket-view page and the updated name is visible on the buckets list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings`);
    const nameInput = page.getByRole('textbox', { name: /name|bucket/i });
    await expect(nameInput).toBeVisible();
    const updatedName = `E2E Bucket One Updated ${Date.now()}`;
    await nameInput.fill(updatedName);

    await actionAndCapture(
      page,
      testInfo,
      'User saves the updated bucket and is taken to the bucket-view page.',
      async () => {
        await page.getByRole('button', { name: /save changes|save|update/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}(?:/|$)`));
      }
    );
    await page.goto(`/buckets?search=${encodeURIComponent(updatedName)}`);
    await expect(page.getByText(new RegExp(updatedName, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list-page shows the updated bucket name after save.'
    );
  });
});
