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
        await expect(page.getByRole('link', { name: /currency/i })).toBeVisible();
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

  test('When the user is on the general-tab, non-currency editable controls are shown and cancel returns to bucket detail.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=general`);
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();

    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: /message body max length/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /public/i })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: /minimum message amount/i })).toHaveCount(0);
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

  test('When the bucket owner updates the minimum message threshold on currency settings, the saved value persists and the messages view remains accessible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=currency`);
    const minimumUsdCentsInput = page.getByRole('spinbutton', {
      name: /minimum message amount/i,
    });
    await expect(minimumUsdCentsInput).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User sets a non-zero minimum message amount threshold and saves the general settings.',
      async () => {
        await minimumUsdCentsInput.fill('250');
        await page.getByRole('button', { name: /save/i }).click();
      }
    );
    await expect(page.getByRole('spinbutton', { name: /minimum message amount/i })).toHaveValue(
      '250'
    );

    await page.reload();
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=currency`)
    );
    await expect(page.getByRole('spinbutton', { name: /minimum message amount/i })).toHaveValue(
      '250'
    );

    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket messages page after saving the threshold and the messages heading remains visible.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages`);
        await expect(page.getByRole('heading', { name: /messages/i })).toBeVisible();
      }
    );

    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=currency`);
    await page.getByRole('spinbutton', { name: /minimum message amount/i }).fill('0');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('spinbutton', { name: /minimum message amount/i })).toHaveValue(
      '0'
    );
  });

  test('When the bucket owner changes currency settings for a bucket with descendants, they are prompted to choose settings scope before save completes.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=currency`);

    await actionAndCapture(
      page,
      testInfo,
      'User changes threshold and saves settings, which opens the apply-to-descendants scope modal.',
      async () => {
        await page.getByRole('spinbutton', { name: /minimum message amount/i }).fill('275');
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/this bucket/i)).toBeVisible();
        await expect(page.getByText(/all sub-buckets|descendants/i)).toBeVisible();
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User applies the settings to this bucket only and the modal closes while settings stay saved.',
      async () => {
        await page.getByRole('button', { name: /this bucket only/i }).click();
        await expect(page.getByRole('spinbutton', { name: /minimum message amount/i })).toHaveValue(
          '275'
        );
      }
    );

    await page.getByRole('spinbutton', { name: /minimum message amount/i }).fill('0');
    await page.getByRole('button', { name: /save/i }).click();
    const thisBucketOnlyButton = page.getByRole('button', { name: /this bucket only/i });
    if (await thisBucketOnlyButton.isVisible()) {
      await thisBucketOnlyButton.click();
    }
    await expect(page.getByRole('spinbutton', { name: /minimum message amount/i })).toHaveValue(
      '0'
    );
  });

  test('When the user manages blocked-apps on the bucket-settings-page, unchecking creates a block row and re-checking removes it.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.request.get(
      `/v1/standard/mb-v1/boost/${E2E_BUCKET1_SHORT_ID}?app_id=metaboost-e2e-web`
    );
    await page.request.get(
      `/v1/standard/mb-v1/boost/${E2E_BUCKET1_SHORT_ID}?app_id=metaboost-e2e-suspended`
    );
    await actionAndCapture(
      page,
      testInfo,
      'User opens the blocked-apps-tab and sees blocked-apps and blocked-senders sections.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=blocked`);
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=blocked`)
        );
        await expect(page.getByRole('heading', { name: /blocked apps/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /blocked senders/i })).toBeVisible();
      }
    );

    const activeRow = page
      .getByRole('row')
      .filter({ hasText: /Metaboost Web E2E/i })
      .first();
    const allowedCheckbox = activeRow.getByRole('checkbox', { name: /allowed/i });
    await expect(activeRow).toBeVisible();
    await expect(allowedCheckbox).toBeChecked();
    await expect(allowedCheckbox).toBeEnabled();

    await actionAndCapture(
      page,
      testInfo,
      'User unchecks the allowed-checkbox for the active app and the app remains unchecked after page reload.',
      async () => {
        await allowedCheckbox.uncheck();
        await expect(allowedCheckbox).not.toBeChecked();
        await page.reload();
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=blocked`)
        );
        await expect(
          page
            .getByRole('row')
            .filter({ hasText: /Metaboost Web E2E/i })
            .first()
            .getByRole('checkbox', { name: /allowed/i })
        ).not.toBeChecked();
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User checks the allowed-checkbox again and the app returns to allowed state after page reload.',
      async () => {
        const checkboxAfterReload = page
          .getByRole('row')
          .filter({ hasText: /Metaboost Web E2E/i })
          .first()
          .getByRole('checkbox', { name: /allowed/i });
        await checkboxAfterReload.check();
        await expect(checkboxAfterReload).toBeChecked();
        await page.reload();
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=blocked`)
        );
        await expect(
          page
            .getByRole('row')
            .filter({ hasText: /Metaboost Web E2E/i })
            .first()
            .getByRole('checkbox', { name: /allowed/i })
        ).toBeChecked();
      }
    );
  });

  test('When a registry-suspended app is shown in blocked-apps, the allowed-checkbox is disabled and a tooltip explains the site-wide block.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.request.get(
      `/v1/standard/mb-v1/boost/${E2E_BUCKET1_SHORT_ID}?app_id=metaboost-e2e-suspended`
    );
    await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings?tab=blocked`);
    await expect(page).toHaveURL(
      new RegExp(`/bucket/${E2E_BUCKET1_SHORT_ID}/settings\\?tab=blocked`)
    );

    const suspendedRow = page
      .getByRole('row')
      .filter({ hasText: /Metaboost E2E Suspended/i })
      .first();
    const suspendedCheckbox = suspendedRow.getByRole('checkbox', { name: /allowed/i });
    await expect(suspendedRow).toBeVisible();
    await expect(suspendedCheckbox).toBeDisabled();

    await actionAndCapture(
      page,
      testInfo,
      'User hovers the info icon for the suspended app row and sees the blocked-everywhere tooltip message.',
      async () => {
        await suspendedRow.locator('.fa-circle-info').first().hover();
        await expect(
          page.getByText(
            /suspended or revoked in the app registry and is blocked everywhere on this server/i
          )
        ).toBeVisible();
      }
    );
  });
});
