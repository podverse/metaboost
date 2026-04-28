import { expect, test } from '@playwright/test';

import {
  loginAsWebE2EAdminWithoutPermission,
  loginAsWebE2EUserAndExpectDashboard,
  nextFixtureName,
} from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';

async function createRoleAndGetId(page: import('@playwright/test').Page): Promise<string> {
  const roleName = nextFixtureName('e2e-web-denied-role');
  await loginAsWebE2EUserAndExpectDashboard(page);
  await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/roles/new`);
  await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
  await page.getByRole('textbox', { name: /role name|name/i }).fill(roleName);
  await page.getByRole('button', { name: /save|create/i }).click();
  await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings\\?tab=roles`));
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

test.describe('Bucket-role-edit-page for the bucket-admin (settings:- roles:- messages:- admins:-) user', () => {
  test('When the bucket-admin (settings:- roles:- messages:- admins:-) without bucket roles permission opens the bucket-role-edit-page, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin (settings:- roles:- messages:- admins:-)');
    const roleId = await createRoleAndGetId(page);
    await page.context().clearCookies();
    await loginAsWebE2EAdminWithoutPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-role-edit-page and sees not found (no bucket update permission).',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings/roles/${roleId}/edit`);
      }
    );
  });
});
