import { expect, test } from '@playwright/test';

import {
  loginAsWebE2EAdminWithPermission,
  loginAsWebE2EUserAndExpectDashboard,
  nextFixtureName,
} from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

async function createRoleAndGetId(page: import('@playwright/test').Page): Promise<string> {
  const roleName = nextFixtureName('e2e-web-role-denied-admin');
  await loginAsWebE2EUserAndExpectDashboard(page);
  await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`);
  await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
  await page.getByRole('textbox', { name: /role name|name/i }).fill(roleName);
  await page.getByRole('button', { name: /save|create/i }).click();
  await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`));
  const roleRow = page.locator('li', { hasText: roleName }).first();
  const editLink = roleRow.getByRole('link', { name: /edit/i });
  await expect(editLink).toBeVisible();
  const href = await editLink.getAttribute('href');
  const match = href?.match(/\/settings\/roles\/([^/]+)\/edit$/);
  if (match === null || match === undefined || match[1] === undefined || match[1] === '') {
    throw new Error(`Could not extract role id from href: ${href ?? 'null'}`);
  }
  return match[1];
}

test.describe('Bucket-role-edit-page for the bucket-admin user', () => {
  test('When the non-owner-admin with bucket roles permission opens the bucket-role-edit-page for an invalid role id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-role-edit-page with an invalid role id and sees not found.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/invalid-role-99999/edit`);
      }
    );
  });

  test('When the non-owner-admin with bucket roles permission opens the roles-list, edit links are not shown.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=roles`);
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`)
    );
    await expect(page.locator('a[href*="/settings/roles/"][href*="/edit"]')).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'The roles-list is visible and edit links are not shown for the bucket-admin.'
    );
  });

  test('When the non-owner-admin with bucket roles permission opens the roles-list, the create role link is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=roles`);
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`)
    );
    await expect(page.getByRole('link', { name: /create role/i })).toBeVisible();
    await capturePageLoad(page, testInfo, 'The roles-list is visible with create-role link.');
  });

  test('When the non-owner-admin with bucket roles permission navigates directly to a valid role edit route, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    const roleId = await createRoleAndGetId(page);
    await page.context().clearCookies();
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User opens a valid role edit route directly and sees not found because edit is owner-only.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/${roleId}/edit`);
      }
    );
  });
});
