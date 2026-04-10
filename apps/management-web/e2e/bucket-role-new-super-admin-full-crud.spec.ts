import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-role-new-page for the super-admin user', () => {
  test('When the super-admin opens the bucket-role-new-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-role-new-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/99999999-9999-4999-a999-999999999999/settings/roles/new');
      }
    );
  });

  test('When a permitted user (super-admin) opens the bucket-role-new-page, they see the role create form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-role-new-route and sees the role create form.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`));
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save|create/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-role-new form is visible with role name and save button.'
    );
  });

  test('When the super-admin navigates from the bucket-settings roles-tab to the new-role page via the create-role link, they see the role create form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=roles`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=roles`));
    const createRoleLink = page.getByRole('link', { name: /create role|new role/i });
    await expect(createRoleLink).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks the create-role link and is taken to the bucket-role-new page.',
      async () => {
        await createRoleLink.click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`));
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-role-new form is visible after navigating from the roles-tab.'
    );
  });

  test('When the user leaves the role name empty and submits, they remain on the bucket-role-new page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();

    const roleNameInput = page.getByRole('textbox', { name: /role name|name/i });
    const submitButton = page.getByRole('button', { name: /save|create/i });
    await expect(roleNameInput).toHaveAttribute('required', '');
    await expect(submitButton).toBeEnabled();

    await actionAndCapture(
      page,
      testInfo,
      'User submits the empty role form and stays on the bucket-role-new page.',
      async () => {
        await submitButton.click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`));
      }
    );
  });

  test('When the user submits a valid new role, a custom role is created and they are returned to the settings roles-list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings/roles/new`);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();

    const roleName = nextFixtureName('e2e-mgmt-role');
    await page.getByRole('textbox', { name: /role name|name/i }).fill(roleName);

    await actionAndCapture(
      page,
      testInfo,
      'User submits the valid new role and is taken to the roles-list.',
      async () => {
        await page.getByRole('button', { name: /save|create/i }).click();
      }
    );

    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=roles`));
    await expect(page.getByText(new RegExp(roleName, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The roles-list shows the newly created role after submit.'
    );
  });
});
