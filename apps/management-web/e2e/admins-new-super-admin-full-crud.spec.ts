import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

/** Password that satisfies strength requirements for create-admin. */
const E2E_VALID_PASSWORD = 'Test!1Aa';

test.describe('Management admins-new-page for the super-admin user', () => {
  test('When a permitted user (super-admin) opens the admins-new-page, they see the add-admin-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management admins-new-route and sees the add-admin form.',
      async () => {
        await page.goto('/admins/new');
        await expect(page).toHaveURL(/\/admins\/new/);
        await expect(page.getByRole('textbox', { name: /display name/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /^username$/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /add admin|create|save/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management add-admin-form is visible with display name, username and submit button.'
    );
  });

  test('When the user leaves the username empty and submits the add-admin-form, they remain on the page and see a validation message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins/new');
    await page.getByRole('textbox', { name: /display name/i }).fill('E2E Display');
    await page.getByLabel(/password/i).fill(E2E_VALID_PASSWORD);
    const submitButton = page.getByRole('button', { name: /add admin|create|save/i });
    await expect(submitButton).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User submits the add-admin-form with empty username and remains on the page with validation.',
      async () => {
        await submitButton.click();
        await expect(page).toHaveURL(/\/admins\/new/);
        await expect(page.getByText(/username.*required|required.*username/i)).toBeVisible();
      }
    );
  });

  test('When the user submits a valid new admin, they are returned to the admins list and the new admin is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins/new');

    const username = nextFixtureName('e2e-mgmt-admin');
    await page.getByRole('textbox', { name: /display name/i }).fill(`E2E Admin ${username}`);
    await page.getByRole('textbox', { name: /^username$/i }).fill(username);
    await page.getByLabel(/password/i).fill(E2E_VALID_PASSWORD);

    await actionAndCapture(
      page,
      testInfo,
      'User submits the valid new admin and is taken to the admins list.',
      async () => {
        await page.getByRole('button', { name: /add admin|create|save/i }).click();
        await expect(page).toHaveURL(/\/admins(\?|$)/);
      }
    );
    await page.goto(`/admins?search=${encodeURIComponent(username)}`);
    await expect(page.getByText(new RegExp(username, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admins list shows the newly created admin after submit.'
    );
  });
});
