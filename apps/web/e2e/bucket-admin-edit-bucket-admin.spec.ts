import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';
const E2E_USER_SHORT_ID = 'e2eusr000001';
const E2E_BUCKET1_ADMIN2_SHORT_ID = 'e2eusr000002';

test.describe('Bucket-admin-edit-page for the bucket-admin user', () => {
  test('When the non-owner-admin with bucket-admins permission opens the bucket-admin-edit-page for the owner, they see the bucket-admin-edit-page with editing disabled and a message.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/admins/${E2E_USER_SHORT_ID}/edit`);
    await expect(
      page.getByText(/you cannot edit the admin settings for the owner of a bucket/i)
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-admin-edit-page is visible with editing disabled for the owner row.'
    );
  });

  test('When the non-owner-admin with bucket-admins permission opens the bucket-admin-edit-page for themselves, they see the bucket-admin-edit-form with Save.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await page.goto(
      `/bucket/${E2E_BUCKET1_SHORT_ID}/settings/admins/${E2E_BUCKET1_ADMIN2_SHORT_ID}/edit`
    );
    await expect(page).toHaveURL(
      new RegExp(
        `/bucket/${E2E_BUCKET1_SHORT_ID}/settings/admins/${E2E_BUCKET1_ADMIN2_SHORT_ID}/edit`
      )
    );
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
    await capturePageLoad(page, testInfo, 'The bucket-admin-edit-form is visible for self.');
  });

  test('When the non-owner-admin with bucket-admins permission opens the bucket-admin-edit-page with an invalid user id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-admin-edit-page with an invalid user id and sees not found.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/admins/invalid-user-99999/edit`);
      }
    );
  });
});
