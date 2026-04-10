import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_MAIN_USER_ID = '11111111-1111-4111-a111-111111111111';

test.describe('Management user-edit-page for the super-admin user', () => {
  test('When the super-admin opens the user-edit-page with an invalid user id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the management user-edit-page with an invalid user id and sees not found.',
      async () => {
        await page.goto('/user/99999999-9999-4999-a999-999999999999/edit');
      }
    );
  });

  test('When a permitted user (super-admin) opens the user-edit-page, they see the user-edit-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management user-edit-route and sees the user-edit-form.',
      async () => {
        await page.goto(`/user/${E2E_MAIN_USER_ID}/edit`);
        await expect(page).toHaveURL(new RegExp(`/user/${E2E_MAIN_USER_ID}/edit`));
        await expect(page.getByRole('textbox', { name: /email|display/i }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: /save|update/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management user-edit-form is visible with email/display and save button.'
    );
  });

  test('When the super-admin navigates from the users-list-page to the user-edit-page via the edit link, the user-edit-form loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/users?search=e2e-bucket-owner@example.com');
    await expect(page).toHaveURL(/\/users/);
    const editLink = page.locator(`a[href*="/user/${E2E_MAIN_USER_ID}/edit"]`).first();
    await expect(editLink).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the edit link on the users-list-page and reaches the user-edit-page.',
      async () => {
        await editLink.click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/user/${E2E_MAIN_USER_ID}/edit`));
    await expect(page.getByRole('textbox', { name: /email|display/i }).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The user-edit-form is visible after navigating from the users-list-page.'
    );
  });

  test('When the user clicks Cancel on the user-edit-form, they are returned to the users-list-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/user/${E2E_MAIN_USER_ID}/edit`);
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on the user-edit-form and is returned to the users-list-page.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page).toHaveURL(/\/users(\?|$)/);
      }
    );
    await capturePageLoad(page, testInfo, 'The users-list-page is visible after Cancel.');
  });

  test('When the user edits the user profile and saves, they are returned to the users list and the updated user is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/user/${E2E_MAIN_USER_ID}/edit`);

    const emailInput = page.getByRole('textbox', { name: /email/i }).first();
    const displayNameInput = page.getByRole('textbox', { name: /display name/i }).first();
    await expect(emailInput).toBeVisible();
    await expect(displayNameInput).toBeVisible();

    const currentEmail = await emailInput.inputValue();
    const updatedDisplayName = `E2E User Updated ${Date.now()}`;
    await displayNameInput.fill(updatedDisplayName);

    await actionAndCapture(
      page,
      testInfo,
      'User saves the updated management user profile and is returned to the users list.',
      async () => {
        await page.getByRole('button', { name: /save changes|save|update/i }).click();
        await expect(page).toHaveURL(/\/users(\?|$)/);
      }
    );
    await page.goto(`/users?search=${encodeURIComponent(currentEmail)}`);
    await expect(page.getByText(new RegExp(updatedDisplayName, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The users list shows the updated user display name after save.'
    );
  });
});
