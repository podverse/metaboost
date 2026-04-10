import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_SUPER_ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

test.describe('Management admin-detail-page for the super-admin user', () => {
  test('When the super-admin opens the admin-detail-page with an invalid admin id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the management admin-detail-page with an invalid admin id and sees not found.',
      async () => {
        await page.goto('/admin/99999999-9999-4999-a999-999999999999');
      }
    );
  });

  test('When a permitted user (super-admin) opens the admin-detail-page, they see the admin detail and the edit link.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management admin-detail-route and sees the admin detail and edit link.',
      async () => {
        await page.goto(`/admin/${E2E_SUPER_ADMIN_ID}`);
        await expect(page).toHaveURL(new RegExp(`/admin/${E2E_SUPER_ADMIN_ID}(?:/|$)`));
        await expect(page.getByRole('heading', { name: /view admin/i })).toBeVisible();
        await expect(page.getByText(/username:\s*e2e-superadmin/i)).toBeVisible();
        await expect(page.locator(`a[href*="/admin/${E2E_SUPER_ADMIN_ID}/edit"]`)).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management admin-detail-page is visible with the super-admin data and edit link.'
    );
  });

  test('When the super-admin navigates from the admins-list-page to the admin-detail-page via the admin link, the admin detail loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/admins');
    await expect(page).toHaveURL(/\/admins/);
    const detailLink = page.locator(`a[href="/admin/${E2E_SUPER_ADMIN_ID}"]`).first();
    await expect(detailLink).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the admin link on the admins-list-page and reaches the admin-detail-page.',
      async () => {
        await detailLink.click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/admin/${E2E_SUPER_ADMIN_ID}(?:/|$)`));
    await expect(page.getByRole('heading', { name: /view admin/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admin-detail-page is visible after navigating from the admins-list-page.'
    );
  });
});
