import { expect, test } from '@playwright/test';

import { loginAsLimitedAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_MAIN_USER_ID = '11111111-1111-4111-a111-111111111111';

test.describe('Management user-detail-page for the admin (admins users events:own) user', () => {
  test('When an admin (admins users events:own) opens the user-detail-page with an invalid user id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the management user-detail-page with an invalid user id and sees not found.',
      async () => {
        await page.goto('/user/99999999-9999-4999-a999-999999999999');
      }
    );
  });

  test('When an admin (admins users events:own) opens the user-detail-page, they see the user detail.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'admin (admins users events:own)');
    await loginAsLimitedAdmin(page);
    await page.goto(`/user/${E2E_MAIN_USER_ID}`);
    await expect(page).toHaveURL(new RegExp(`/user/${E2E_MAIN_USER_ID}(?:/|$)`));
    await expect(
      page.getByText(/e2e-bucket-owner@example.com|view user|email/i).first()
    ).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The admin (admins users events:own) sees the user-detail-page when they have users read permission.'
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
