import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import {
  clickDeleteAndAcceptBrowserDialog,
  expectInvalidRouteShowsNotFound,
} from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Bucket-settings-page for the bucket-owner user', () => {
  test('When the user opens the bucket-settings-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-settings-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/invalid-bucket-99999/settings');
      }
    );
  });

  test('When an authenticated user opens the bucket-settings-page, they see the bucket-settings-page with tabs.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page and sees the settings form or admins section.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings`));
        await expect(page.getByRole('heading', { name: /settings|bucket/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /general/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /admins/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /roles/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-settings-page is visible with a save button or settings heading.'
    );
  });

  test('When the user opens the bucket-settings-page with tab=roles, the roles-tab content is shown and the URL is preserved.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page with tab=roles and sees the roles-tab content.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=roles`);
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`)
        );
        await expect(page.getByText(/roles/i).first()).toBeVisible();
      }
    );
    await capturePageLoad(page, testInfo, 'The roles-tab is visible and URL has tab=roles.');
  });

  test('When the user opens the bucket-settings-page with tab=admins, the admins-tab content is shown and the URL is preserved.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page with tab=admins and sees the admins-tab content.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=admins`);
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=admins`)
        );
        await expect(page.getByText(/admins/i).first()).toBeVisible();
      }
    );
    await capturePageLoad(page, testInfo, 'The admins-tab is visible and URL has tab=admins.');
  });

  test('When the user is on the admins-tab, the owner row does not show a delete button.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=admins`);
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=admins`)
    );
    const ownerRow = page.getByRole('listitem').filter({ hasText: /owner/i }).first();
    await expect(ownerRow).toBeVisible();
    await expect(ownerRow.getByRole('button', { name: /delete/i })).toHaveCount(0);
    await capturePageLoad(
      page,
      testInfo,
      'The owner row on the admins-tab has no delete button (owner protection).',
      ownerRow
    );
  });

  test('When the user is on the admins-tab, they can generate an invitation link.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await page
      .getByRole('textbox', { name: /role name|name/i })
      .fill(`e2e-admin-role-${Date.now()}`);
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`)
    );

    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=admins`);
    await expect(page.getByRole('button', { name: /add admin/i })).toBeVisible();

    await expect(page.getByRole('button', { name: /add admin/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User generates an admin invitation link from the admins-tab.',
      async () => {
        await page.getByRole('button', { name: /add admin/i }).click();
      }
    );

    const inviteLinkInput = page
      .getByRole('textbox', { name: /invite link|invitation/i })
      .or(page.locator('input[value*="/invite/"]'));
    await expect(inviteLinkInput.first()).toBeVisible();
  });

  test('When the user is on the admins-tab, they can remove a pending invitation.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings/roles/new`);
    await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
    await page
      .getByRole('textbox', { name: /role name|name/i })
      .fill(`e2e-admin-role-${Date.now()}`);
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=roles`)
    );

    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=admins`);
    await expect(page.getByRole('button', { name: /add admin/i })).toBeVisible();
    await page.getByRole('button', { name: /add admin/i }).click();
    const pendingRows = page.locator('table tbody tr');
    await expect(pendingRows.first()).toBeVisible();
    const firstInviteHref = await pendingRows
      .first()
      .getByRole('link')
      .first()
      .getAttribute('href');

    await actionAndCapture(
      page,
      testInfo,
      'User deletes the first pending admin invitation row.',
      async () => {
        await clickDeleteAndAcceptBrowserDialog(
          page,
          pendingRows.first().getByRole('button', { name: /delete/i })
        );
      }
    );
    if (firstInviteHref !== null && firstInviteHref !== '') {
      await expect(page.locator(`a[href="${firstInviteHref}"]`)).toHaveCount(0);
    }
  });

  test('When the user is on the general-tab, editable controls are shown and cancel returns to bucket detail.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=general`);
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();

    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: /message body max length/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /public/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks cancel from general-tab settings and is taken to bucket detail.',
      async () => {
        await page.getByRole('link', { name: /cancel/i }).click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}$`));
  });
});
