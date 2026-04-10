import { expect, test } from '@playwright/test';

import { loginAsLimitedAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_MAIN_USER_ID = '11111111-1111-4111-a111-111111111111';

test.describe('Management users-list-page for the admin (admins users events:own) user', () => {
  test('When an admin (admins users events:own) opens the users-list-page, they see the users heading and list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await page.goto('/users');
    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admin (admins users events:own) sees the users-list-page when they have users read permission.'
    );
  });

  test('When an admin (admins users events:own) navigates from the users-list-page to user-detail via the user link, the user detail loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await page.goto('/users?search=e2e-bucket-owner@example.com');
    await expect(page).toHaveURL(/\/users/);
    const detailLink = page.locator(`a[href="/user/${E2E_MAIN_USER_ID}"]`).first();
    await expect(detailLink).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the user link on the users-list-page and reaches the user-detail-page.',
      async () => {
        await detailLink.click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/user/${E2E_MAIN_USER_ID}(?:/|$)`));
    await expect(
      page.getByText(/e2e-bucket-owner@example.com|view user|email/i).first()
    ).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The user-detail-page is visible after navigating from the users-list-page.'
    );
  });
});
