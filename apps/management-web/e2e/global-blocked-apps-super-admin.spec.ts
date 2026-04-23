import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { actionAndCapture } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

/** Server-resynced controlled checkboxes: `check()`/`uncheck()` time out before GET refresh applies. */
const asyncCheckboxTimeoutMs = 15_000;

test.describe('Global blocked apps page for the super-admin user', () => {
  test('When the super-admin opens the global-blocked-apps page, they can toggle a site-wide block and the change persists across reload.', async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(35_000);
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the global-blocked-apps page and sees the global table.',
      async () => {
        await page.goto('/global-blocked-apps');
        await expect(page).toHaveURL(/\/global-blocked-apps/);
        await expect(page.getByText(/Metaboost Web E2E/i).first()).toBeVisible({ timeout: 20_000 });
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
      'User checks the site-wide block checkbox and the state persists after reload.',
      async () => {
        await globalBlockedCheckbox.click();
        await expect(globalBlockedCheckbox).toBeChecked({ timeout: asyncCheckboxTimeoutMs });
        await page.reload();
        await expect(page).toHaveURL(/\/global-blocked-apps/);
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
      'User unchecks the site-wide block checkbox and the state persists after reload.',
      async () => {
        const checkboxAfterReload = page
          .getByRole('row')
          .filter({ hasText: /Metaboost Web E2E/i })
          .first()
          .getByRole('checkbox', { name: /blocked site-wide/i });
        await checkboxAfterReload.click();
        await expect(checkboxAfterReload).not.toBeChecked({ timeout: asyncCheckboxTimeoutMs });
        await page.reload();
        await expect(page).toHaveURL(/\/global-blocked-apps/);
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

  test('When a registry-suspended app is on the global-blocked-apps page, its site-wide checkbox is disabled and a tooltip explains why.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/global-blocked-apps');
    await expect(page).toHaveURL(/\/global-blocked-apps/);

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
      'User hovers the suspended app info icon and sees the registry-blocked tooltip message.',
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
