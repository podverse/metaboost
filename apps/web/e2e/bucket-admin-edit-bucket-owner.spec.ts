import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';
const E2E_USER_ID_TEXT = 'e2eusr000001';
const E2E_BUCKET1_ADMIN2_ID_TEXT = 'e2eusr000002';

test.describe('Bucket-admin-edit-page for the bucket-owner user', () => {
  test("When the user opens the bucket-admin-edit-route with the bucket-owner's user id, they see the bucket-admin-edit-page with editing disabled and a message.", async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/admins/${E2E_USER_ID_TEXT}/edit`);
    await expect(
      page.getByText(/you cannot edit the admin settings for the owner of a bucket/i)
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-admin-edit-page is visible with editing disabled and the owner message.'
    );
  });

  test('When the user opens the bucket-admin-edit-page with an invalid user id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-admin-edit-page with an invalid user id and sees not found.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/admins/invalid-user-99999/edit`);
      }
    );
  });

  test('When the owner navigates from the admins-list to the bucket-admin-edit-page for the bucket-admin, the bucket-admin-edit-form loads and is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-admins-tab and sees the admins-list.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings?tab=admins`);
      }
    );
    const adminEditLinkFromList = page
      .locator(`a[href*="admins/${E2E_BUCKET1_ADMIN2_ID_TEXT}/edit"]`)
      .first();
    await expect(adminEditLinkFromList).toBeVisible({ timeout: 10_000 });
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the edit link for the bucket-admin and reaches the bucket-admin-edit-page.',
      async () => {
        await page.locator(`a[href*="admins/${E2E_BUCKET1_ADMIN2_ID_TEXT}/edit"]`).click();
      }
    );
    await expect(page).toHaveURL(
      new RegExp(
        `/bucket/${E2E_BUCKET1_ID_TEXT}/settings/admins/${E2E_BUCKET1_ADMIN2_ID_TEXT}/edit`
      )
    );
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-admin-edit-form is visible after navigating from the admins-list.'
    );
  });

  test('When the owner clicks Cancel on the bucket-admin-edit-page, they return to the admins-list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(
      `/bucket/${E2E_BUCKET1_ID_TEXT}/settings/admins/${E2E_BUCKET1_ADMIN2_ID_TEXT}/edit`
    );
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel and returns to the admins-list.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings\\?tab=admins`)
    );
    const adminEditLinkFromCancel = page
      .locator(`a[href*="admins/${E2E_BUCKET1_ADMIN2_ID_TEXT}/edit"]`)
      .first();
    await expect(adminEditLinkFromCancel).toBeVisible({ timeout: 10_000 });
    await capturePageLoad(page, testInfo, 'The admins-list is visible after Cancel.');
  });

  test('When the user opens the bucket-admin-edit-page for the bucket-admin, the form loads and is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-admin-edit-page for the bucket-admin and sees the form.',
      async () => {
        await page.goto(
          `/bucket/${E2E_BUCKET1_ID_TEXT}/settings/admins/${E2E_BUCKET1_ADMIN2_ID_TEXT}/edit`
        );
      }
    );
    await expect(page).toHaveURL(
      new RegExp(
        `/bucket/${E2E_BUCKET1_ID_TEXT}/settings/admins/${E2E_BUCKET1_ADMIN2_ID_TEXT}/edit`
      )
    );
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-admin-edit-form is visible for the bucket-admin.'
    );
  });

  test('When the user saves the bucket-admin-edit-form for the bucket-admin, the admin is updated and they return to the admins-list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(
      `/bucket/${E2E_BUCKET1_ID_TEXT}/settings/admins/${E2E_BUCKET1_ADMIN2_ID_TEXT}/edit`
    );
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks save on the bucket-admin-edit-form.',
      async () => {
        await page.getByRole('button', { name: /save/i }).click();
      }
    );

    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings\\?tab=admins`)
    );
    const adminEditLinkAfterSave = page
      .locator(`a[href*="admins/${E2E_BUCKET1_ADMIN2_ID_TEXT}/edit"]`)
      .first();
    await expect(adminEditLinkAfterSave).toBeVisible({ timeout: 10_000 });
    await capturePageLoad(
      page,
      testInfo,
      'The admins-list is visible and shows the updated admin.'
    );
  });
});
