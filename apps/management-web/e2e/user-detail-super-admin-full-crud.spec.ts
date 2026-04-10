import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_MAIN_USER_ID = '11111111-1111-4111-a111-111111111111';

test.describe('Management user-detail-page for the super-admin user', () => {
  test('When the super-admin opens the user-detail-page with an invalid user id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the management user-detail-page with an invalid user id and sees not found.',
      async () => {
        await page.goto('/user/99999999-9999-4999-a999-999999999999');
      }
    );
  });

  test('When a permitted user (super-admin) opens the user-detail-page, they see the user detail and the edit link.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management user-detail-route and sees the user detail and edit link.',
      async () => {
        await page.goto(`/user/${E2E_MAIN_USER_ID}`);
        await expect(page).toHaveURL(new RegExp(`/user/${E2E_MAIN_USER_ID}(?:/|$)`));
        await expect(
          page.getByText(/e2e-bucket-owner@example.com|view user|email/i).first()
        ).toBeVisible();
        await expect(page.locator(`a[href*="/user/${E2E_MAIN_USER_ID}/edit"]`)).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management user-detail-page is visible with the bucket-owner user email and edit link.'
    );
  });

  test('When the super-admin navigates from the users-list-page to the user-detail-page via the user link, the user detail loads.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
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
