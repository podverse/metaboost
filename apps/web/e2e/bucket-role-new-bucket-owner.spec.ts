import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard, nextFixtureName } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Bucket-role-new-page for the bucket-owner user', () => {
  test('When an authenticated user opens the bucket-role-new-page, they see the bucket-role-new-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-role-new-route and sees the bucket-role-new-form.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`));
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save|create/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-role-new-form is visible with a role name and save button.'
    );
  });

  test('When the user opens the bucket-role-new-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-role-new-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/invalid-bucket-99999/settings/roles/new');
      }
    );
  });

  test('When the user leaves the role name empty and submits the bucket-role-new-form, they remain on the page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();

    const roleNameInput = page.getByRole('textbox', { name: /role name|name/i });
    const submitButton = page.getByRole('button', { name: /save|create/i });
    await expect(roleNameInput).toHaveAttribute('required', '');
    await expect(submitButton).toBeEnabled();
    await actionAndCapture(
      page,
      testInfo,
      'User submits the form with empty required role name and stays on the page.',
      async () => {
        await submitButton.click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`));
  });

  test('When the user submits a valid new bucket role, a custom role is created and they are returned to the roles-list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();

    const roleName = nextFixtureName('e2e-web-role');
    await page.getByRole('textbox', { name: /role name|name/i }).fill(roleName);

    await actionAndCapture(
      page,
      testInfo,
      'User submits the valid new bucket role and is taken to the roles-list.',
      async () => {
        await page.getByRole('button', { name: /save|create/i }).click();
      }
    );

    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`)
    );
    await expect(page.getByText(new RegExp(roleName, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The roles-list is visible with the new role after create.'
    );
  });

  test('When the owner navigates from the roles-list to the bucket-role-new-page, they see the bucket-role-new-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=roles`);
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`)
    );
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the new-role link and reaches the bucket-role-new-page.',
      async () => {
        await page.getByRole('link', { name: /add role|new role|create/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`));
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save|create/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-role-new-form is visible after navigating from the roles-list.'
    );
  });

  test('When the owner clicks Cancel on the bucket-role-new-page, they return to the roles-list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`);
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on the bucket-role-new-page and returns to the roles-list.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`)
    );
    await capturePageLoad(page, testInfo, 'The roles-list is visible after Cancel.');
  });

  test('When the bucket-role-new-page has an unsafe returnUrl query, Cancel uses the roles-list fallback.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const unsafeReturn = encodeURIComponent('//evil.example/path');
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new?returnUrl=${unsafeReturn}`);
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel when returnUrl was unsafe and lands on the roles-list fallback.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`)
    );
  });

  test('When the bucket-role-new-page has a safe internal returnUrl, Cancel navigates to that path.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(
      `/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new?returnUrl=${encodeURIComponent('/settings')}`
    );
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel with a safe returnUrl and reaches the account settings route.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(/\/settings(\?|$)/);
  });

  test('When bucket-create is on, message-create remains checked and disabled.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();

    const createCheckboxes = page.getByRole('checkbox', { name: /^create$/i });
    const bucketCreate = createCheckboxes.nth(1);
    const messageCreate = createCheckboxes.nth(2);

    await expect(bucketCreate).toBeVisible();
    await expect(messageCreate).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User verifies that bucket-create and message-create have the expected dependency.',
      async () => {
        await expect(bucketCreate).toBeChecked();
      }
    );
    await expect(messageCreate).toBeChecked();
    await expect(messageCreate).toBeDisabled();
  });
});
