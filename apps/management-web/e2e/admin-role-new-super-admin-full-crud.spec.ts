import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management admin-role-new-page for the super-admin user', () => {
  test('When a permitted user (super-admin) opens the admin-role-new-page, they see the admin-role-new-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management admin-role-new-route and sees the add-role form.',
      async () => {
        await page.goto('/admins/roles/new');
        await expect(page).toHaveURL(/\/admins\/roles\/new/);
        await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /create role|save|create/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management admin-role-new-form is visible with role name and create button.'
    );
  });

  test('When the user leaves the role name empty and clicks Create role, they remain on the admin-role-new-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins/roles/new');
    const roleNameInput = page.getByRole('textbox', { name: /role name|name/i });
    const createButton = page.getByRole('button', { name: /create role/i });
    await expect(roleNameInput).toBeVisible();
    await expect(createButton).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks Create role with empty role name and remains on the admin-role-new-page.',
      async () => {
        await createButton.click();
        await expect(page).toHaveURL(/\/admins\/roles\/new/);
      }
    );
  });

  test('When the super-admin clicks Cancel on the admin-role-new-form, they are returned to the admins-list-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins/roles/new');
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on the admin-role-new-form and is returned to the admins-list-page.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(/\/admins(\?|$)/);
    await capturePageLoad(page, testInfo, 'The admins-list-page is visible after Cancel.');
  });

  test('When the user submits a valid new admin role, they are returned to the admins page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins/roles/new');
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();

    const roleName = nextFixtureName('e2e-mgmt-admin-role');
    await page.getByRole('textbox', { name: /role name|name/i }).fill(roleName);

    await actionAndCapture(
      page,
      testInfo,
      'User submits the valid new admin role and is taken to the admins page.',
      async () => {
        await page.getByRole('button', { name: /create role/i }).click();
        await expect(page).toHaveURL(/\/admins(\?|$)/);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The admins page is visible after creating a new admin role.'
    );
  });

  test('When the super-admin navigates from the admins-list-page to the admin-role-new-page via the add-admin form role option, the admin-role-new-form loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins');
    await expect(page).toHaveURL(/\/admins/);
    await page
      .getByRole('link', { name: /add admin|new admin|create/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admins\/new/);
    const roleCombobox = page.getByRole('combobox', { name: /role/i });
    await expect(roleCombobox).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User selects the Custom Role option on the add-admin form and is taken to the admin-role-new-page.',
      async () => {
        await roleCombobox.selectOption({ label: 'Custom Role' });
      }
    );
    await expect(page).toHaveURL(/\/admins\/roles\/new/);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admin-role-new-form is visible after navigating from the add-admin form.'
    );
  });
});
