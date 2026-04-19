import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';

test.describe('Management bucket-settings-page for the super-admin user', () => {
  test('When the super-admin opens the bucket-settings-page with an invalid bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-settings-page with an invalid bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/99999999-9999-4999-a999-999999999999/settings');
      }
    );
  });

  test('When a permitted user (super-admin) opens the bucket-settings-page, they see the settings with general, admins, and roles tabs.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page and sees general, admins, and roles tabs.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings`));
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^general$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^admins$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^roles$/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-settings-page is visible with general, admins, and roles tabs.'
    );
  });

  test('When the user opens the bucket-settings-page with ?tab=admins, the URL preserves tab=admins and the admins-tab content is shown.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page with ?tab=admins and sees the admins-tab content.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=admins`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=admins`));
    await expect(
      page
        .getByRole('link', { name: /add admin/i })
        .or(page.getByRole('button', { name: /add admin/i }))
    ).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-settings-page shows the admins-tab content when tab=admins is in the URL.'
    );
  });

  test('When the user opens the bucket-settings-page with ?tab=roles, the URL preserves tab=roles and the roles-tab content is shown.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page with ?tab=roles and sees the roles-tab content.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=roles`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=roles`));
    await expect(page.getByRole('link', { name: /create role/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-settings-page shows the roles-tab content when tab=roles is in the URL.'
    );
  });

  test('When the super-admin opens the blocked-apps-tab, they can toggle a global block and the change persists across reload.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page blocked-apps-tab and sees blocked-apps controls.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=blocked`);
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=blocked`)
        );
        await expect(page.getByRole('heading', { name: /global blocked apps/i })).toBeVisible();
      }
    );

    const activeRow = page
      .getByRole('row')
      .filter({ hasText: /Metaboost Web E2E/i })
      .first();
    const globalBlockedCheckbox = activeRow.getByRole('checkbox', { name: /blocked site-wide/i });
    await expect(activeRow).toBeVisible();
    await expect(globalBlockedCheckbox).toBeEnabled();

    await actionAndCapture(
      page,
      testInfo,
      'User checks the global-block-checkbox for the active app and the checked state persists after page reload.',
      async () => {
        await globalBlockedCheckbox.check();
        await expect(globalBlockedCheckbox).toBeChecked();
        await page.reload();
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=blocked`)
        );
        await expect(
          page
            .getByRole('row')
            .filter({ hasText: /Metaboost Web E2E/i })
            .first()
            .getByRole('checkbox', { name: /blocked site-wide/i })
        ).toBeChecked();
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User unchecks the global-block-checkbox for the active app and the unchecked state persists after page reload.',
      async () => {
        const checkboxAfterReload = page
          .getByRole('row')
          .filter({ hasText: /Metaboost Web E2E/i })
          .first()
          .getByRole('checkbox', { name: /blocked site-wide/i });
        await checkboxAfterReload.uncheck();
        await expect(checkboxAfterReload).not.toBeChecked();
        await page.reload();
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=blocked`)
        );
        await expect(
          page
            .getByRole('row')
            .filter({ hasText: /Metaboost Web E2E/i })
            .first()
            .getByRole('checkbox', { name: /blocked site-wide/i })
        ).not.toBeChecked();
      }
    );
  });

  test('When a registry-suspended app is shown on the blocked-apps-tab, its global-block-checkbox is disabled and a tooltip explains why.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=blocked`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=blocked`));

    const suspendedRow = page
      .getByRole('row')
      .filter({ hasText: /Metaboost E2E Suspended/i })
      .first();
    const suspendedCheckbox = suspendedRow.getByRole('checkbox', { name: /blocked site-wide/i });
    await expect(suspendedRow).toBeVisible();
    await expect(suspendedCheckbox).toBeDisabled();

    await actionAndCapture(
      page,
      testInfo,
      'User hovers the suspended-app info icon and sees the registry-blocked tooltip message.',
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
