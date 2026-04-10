import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_SUPER_ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

test.describe('Management admin-edit-page for the super-admin user', () => {
  test('When the super-admin opens the admin-edit-page with an invalid admin id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the management admin-edit-page with an invalid admin id and sees not found.',
      async () => {
        await page.goto('/admin/99999999-9999-4999-a999-999999999999/edit');
      }
    );
  });

  test('When the super-admin opens the admin-edit-page, they see the admin-edit-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management admin-edit-route and sees the admin-edit-form.',
      async () => {
        await page.goto(`/admin/${E2E_SUPER_ADMIN_ID}/edit`);
        await expect(page).toHaveURL(new RegExp(`/admin/${E2E_SUPER_ADMIN_ID}/edit`));
        await expect(page.getByRole('textbox', { name: /display name/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /^username$/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /save|update/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management admin-edit-form is visible with fields and save button.'
    );
  });

  test('When the super-admin navigates from the admins-list-page to the admin-edit-page via the edit link, the admin-edit-form loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins');
    await expect(page).toHaveURL(/\/admins/);
    const editLink = page.locator(`a[href*="/admin/${E2E_SUPER_ADMIN_ID}/edit"]`);
    await expect(editLink.first()).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the edit link on the admins-list-page and reaches the admin-edit-page.',
      async () => {
        await editLink.first().click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/admin/${E2E_SUPER_ADMIN_ID}/edit`));
    await expect(page.getByRole('textbox', { name: /display name/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admin-edit-form is visible after navigating from the admins-list-page.'
    );
  });

  test('When the user clicks Cancel on the admin-edit-form, they are returned to the admins-list-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/admin/${E2E_SUPER_ADMIN_ID}/edit`);
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on the admin-edit-form and is returned to the admins-list-page.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page).toHaveURL(/\/admins(\?|$)/);
      }
    );
    await capturePageLoad(page, testInfo, 'The admins-list-page is visible after Cancel.');
  });

  test('When the user edits the admin profile and saves, they are returned to the admins list and the updated admin is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/admin/${E2E_SUPER_ADMIN_ID}/edit`);

    const displayNameInput = page.getByRole('textbox', { name: /display name/i });
    await expect(displayNameInput).toBeVisible();
    const updatedDisplayName = `E2E Superadmin ${Date.now()}`;
    await displayNameInput.fill(updatedDisplayName);

    await actionAndCapture(
      page,
      testInfo,
      'User saves the updated management admin display name and is returned to the admins list.',
      async () => {
        await page.getByRole('button', { name: /save changes|save|update/i }).click();
        await expect(page).toHaveURL(/\/admins(\?|$)/);
      }
    );
    await page.goto('/admins?search=e2e-superadmin');
    await expect(page.getByText(new RegExp(updatedDisplayName, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admins-list-page shows the updated admin display name after save.'
    );
  });
});
