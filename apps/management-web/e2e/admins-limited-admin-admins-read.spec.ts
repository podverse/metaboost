import { expect, test } from '@playwright/test';

import { loginAsLimitedAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_SUPER_ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

test.describe('Management admins-list-page for the admin (admins users events:own) user', () => {
  test('When a admin (admins users events:own) opens the admins-list-page, they see the admins heading and list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await page.goto('/admins');
    await expect(page).toHaveURL(/\/admins/);
    await expect(page.getByRole('heading', { name: /admins/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admin (admins users events:own) sees the admins-list-page when they have admins read permission.'
    );
  });

  test('When a admin (admins users events:own) navigates from the admins-list-page to admin-detail via the admin link, the admin detail loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
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
