import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { clickConfirmDeleteInModal } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management admins-list-page for the super-admin user', () => {
  test('When a permitted user opens the admins-list-page, they see the admins list or add-admin CTA.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management admins-list-page and sees the list or add-admin CTA.',
      async () => {
        await page.goto('/admins');
        await expect(page).toHaveURL(/\/admins/);
        await expect(page.getByRole('heading', { name: /admins/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /add admin|new admin|create/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management admins-list-page is visible with list or add-admin CTA.'
    );
  });

  test('When the user opens the admins route with explicit query params, the params are persisted.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management admins-list-page with query params and they persist.',
      async () => {
        await page.goto('/admins?search=e2e-superadmin&page=1&sortBy=username&sortOrder=asc');
      }
    );
    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe('/admins');
    expect(currentUrl.searchParams.get('search')).toBe('e2e-superadmin');
    expect(currentUrl.searchParams.get('sortBy')).toBe('username');
    expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');
    await expect(page.getByRole('heading', { name: /admins/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admins-list-page preserves search, sortBy and sortOrder in the URL.'
    );
  });

  test('When the user clicks the add-admin CTA, they are navigated to the new-admin form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins');
    await expect(page.getByRole('heading', { name: /admins/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the add-admin CTA and is navigated to the management admins-new route.',
      async () => {
        await page
          .getByRole('link', { name: /add admin|new admin|create/i })
          .first()
          .click();
      }
    );
    await expect(page).toHaveURL(/\/admins\/new/);
    await expect(page.getByRole('heading', { name: /add admin/i })).toBeVisible();
  });

  test('When the user views the superadmin row on the admins-list-page, no delete action is exposed.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins?search=e2e-superadmin');

    const superAdminRow = page.locator('tr', { hasText: /e2e-superadmin/i }).first();
    await expect(superAdminRow).toBeVisible();
    await expect(superAdminRow.getByRole('button', { name: /delete/i })).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'The admins-list-page superadmin row is visible without a delete action.'
    );
  });

  test('When the user opens the delete confirmation for a created admin on the admins-list-page and cancels, the row remains.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins/new');
    await expect(page.getByRole('textbox', { name: /display name/i })).toBeVisible();

    const username = nextFixtureName('e2e-admin-cancel-delete');
    const displayName = `E2E ${username}`;
    await page.getByRole('textbox', { name: /display name/i }).fill(displayName);
    await page.getByRole('textbox', { name: /^username$/i }).fill(username);
    await page.getByLabel(/^password/i).fill('Test!1Aa');
    await page.getByRole('button', { name: /add admin|create|save/i }).click();
    await expect(page).toHaveURL(/\/admins(\?|$)/);

    await page.goto(`/admins?search=${encodeURIComponent(username)}`);
    const row = page.locator('tr', { hasText: username }).first();
    await expect(row).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User opens the admin delete confirmation and clicks cancel.',
      async () => {
        await row.getByRole('button', { name: /delete/i }).click();
        const cancelButton = page
          .locator('button')
          .filter({ hasText: /cancel/i })
          .last();
        await expect(cancelButton).toBeVisible();
        await cancelButton.click();
      }
    );

    await expect(page.locator('tr', { hasText: username })).toHaveCount(1);
  });

  test('When the user deletes a created admin from the admins-list-page, the admin is removed.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins/new');
    await expect(page.getByRole('textbox', { name: /display name/i })).toBeVisible();

    const username = nextFixtureName('e2e-admin-delete');
    const displayName = `E2E ${username}`;
    await page.getByRole('textbox', { name: /display name/i }).fill(displayName);
    await page.getByRole('textbox', { name: /^username$/i }).fill(username);
    await page.getByLabel(/^password/i).fill('Test!1Aa');

    await page.getByRole('button', { name: /add admin|create|save/i }).click();
    await expect(page).toHaveURL(/\/admins(\?|$)/);

    await page.goto(`/admins?search=${encodeURIComponent(username)}`);
    const row = page.locator('tr', { hasText: username }).first();
    await expect(row).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User deletes the created admin row from the admins-list-page.',
      async () => {
        await row.getByRole('button', { name: /delete/i }).click();
        await clickConfirmDeleteInModal(page);
      }
    );

    await page.goto(`/admins?search=${encodeURIComponent(username)}`);
    await expect(page).toHaveURL(/\/admins\?search=/);
    await expect(page.locator('tr', { hasText: username })).toHaveCount(0);
  });
});
