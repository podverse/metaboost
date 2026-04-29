import { expect, test } from '@playwright/test';

import { createChildBucketFixture, loginAsManagementSuperAdmin } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';
const e2eBucket1CurrencySettingsUrl = new RegExp(
  `/bucket/${E2E_BUCKET1_ID}/settings\\?tab=currency$`
);
/** After successful settings save, BucketForm navigates to the bucket detail view (not settings). */
const e2eBucket1ViewUrl = new RegExp(`^https?://[^/]+/bucket/${E2E_BUCKET1_ID}$`);
/** Server-resynced controlled checkboxes: `check()`/`uncheck()` time out before GET refresh applies. */
const asyncCheckboxTimeoutMs = 15_000;

test.describe('Management bucket-settings-page for the super-admin user', () => {
  test.beforeEach(({}, testInfo) => {
    testInfo.setTimeout(30_000);
  });

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

  test('When a permitted user (super-admin) opens the bucket-settings-page, they see the settings with general, currency, admins, and roles tabs.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page and sees general, currency, admins, and roles tabs.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings`));
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^general$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^currency$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^admins$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^roles$/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-settings-page is visible with general, currency, admins, and roles tabs.'
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

  test('When the super-admin updates the minimum boost threshold on currency settings, the saved value persists and the messages tab remains accessible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);
    const minimumUsdCentsInput = page.getByLabel(/minimum boost amount/i);
    await expect(minimumUsdCentsInput).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User sets a non-zero minimum boost amount threshold and saves management bucket currency settings.',
      async () => {
        await minimumUsdCentsInput.fill('250');
        await page.getByRole('button', { name: /save/i }).click();
      }
    );
    const thisBucketOnlyAfterMinBoostSave = page.getByRole('button', { name: /this bucket only/i });
    try {
      await thisBucketOnlyAfterMinBoostSave.waitFor({ state: 'visible', timeout: 8000 });
      await thisBucketOnlyAfterMinBoostSave.click();
    } catch {
      /* no apply-to-descendants choice when the bucket has no sub-buckets */
    }
    await expect(page).toHaveURL(e2eBucket1ViewUrl);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);
    await expect(page.getByLabel(/minimum boost amount/i)).toHaveValue('250');

    await page.reload();
    await expect(page).toHaveURL(e2eBucket1CurrencySettingsUrl);
    await expect(page.getByLabel(/minimum boost amount/i)).toHaveValue('250');

    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket detail messages tab after saving the threshold and the messages panel remains visible.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}?tab=messages`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}`));
        await expect(page.getByRole('button', { name: /^sort$/i })).toBeVisible();
      }
    );

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);
    await page.getByLabel(/minimum boost amount/i).fill('0');
    await page.getByRole('button', { name: /save/i }).click();
    const thisBucketOnlyForZero = page.getByRole('button', { name: /this bucket only/i });
    try {
      await thisBucketOnlyForZero.waitFor({ state: 'visible', timeout: 8000 });
      await thisBucketOnlyForZero.click();
    } catch {
      /* no apply-to-descendants choice when the bucket has no sub-buckets */
    }
    await expect(page).toHaveURL(e2eBucket1ViewUrl);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);
    await expect(page.getByLabel(/minimum boost amount/i)).toHaveValue('0', { timeout: 10_000 });
    await page.reload();
    await expect(page).toHaveURL(e2eBucket1CurrencySettingsUrl);
    await expect(page.getByLabel(/minimum boost amount/i)).toHaveValue('0');
  });

  test('When the super-admin changes currency settings for a bucket with descendants, they are prompted to choose settings scope before save completes.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await createChildBucketFixture(page.request, E2E_BUCKET1_ID);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);

    await actionAndCapture(
      page,
      testInfo,
      'User changes threshold and saves settings, which opens the apply-to-descendants scope modal.',
      async () => {
        await page.getByLabel(/minimum boost amount/i).fill('275');
        await page.getByRole('button', { name: /save/i }).click();
        await expect(
          page.getByText(
            /apply these setting changes only to this bucket, or to all sub-buckets too/i
          )
        ).toBeVisible();
        await expect(page.getByRole('button', { name: /apply to all sub-buckets/i })).toBeVisible();
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User applies the settings to this bucket only and the modal closes while settings stay saved.',
      async () => {
        await page.getByRole('button', { name: /this bucket only/i }).click();
        await expect(page).toHaveURL(e2eBucket1ViewUrl);
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);
        await expect(page.getByLabel(/minimum boost amount/i)).toHaveValue('275');
      }
    );

    await page.getByLabel(/minimum boost amount/i).fill('0');
    await page.getByRole('button', { name: /save/i }).click();
    const thisBucketOnlyButton = page.getByRole('button', { name: /this bucket only/i });
    try {
      await thisBucketOnlyButton.waitFor({ state: 'visible', timeout: 8000 });
      await thisBucketOnlyButton.click();
    } catch {
      /* no scope when change does not require propagation */
    }
    await expect(page).toHaveURL(e2eBucket1ViewUrl);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);
    await expect(page.getByLabel(/minimum boost amount/i)).toHaveValue('0');
  });

  test('When the super-admin opens the bucket blocked-apps tab, they can toggle per-bucket app allowance and the change persists across reload.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-settings-page blocked-apps-tab and sees per-bucket blocked-apps controls.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=blocked`);
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=blocked`)
        );
        await expect(page.getByText(/Metaboost Web E2E/i).first()).toBeVisible({ timeout: 20_000 });
      }
    );

    const activeRow = page
      .getByRole('row')
      .filter({ hasText: /Metaboost Web E2E/i })
      .first();
    const allowedCheckbox = activeRow.getByRole('checkbox', { name: /^Allowed$/i });
    await expect(activeRow).toBeVisible();
    await expect(allowedCheckbox).toBeEnabled();
    const initiallyChecked = await allowedCheckbox.isChecked();
    if (initiallyChecked) {
      await actionAndCapture(
        page,
        testInfo,
        'User unchecks Allowed for the app to add a bucket-level block, and the state persists after reload.',
        async () => {
          await allowedCheckbox.click();
          await expect(allowedCheckbox).not.toBeChecked({ timeout: asyncCheckboxTimeoutMs });
          await page.reload();
          await expect(
            page
              .getByRole('row')
              .filter({ hasText: /Metaboost Web E2E/i })
              .first()
              .getByRole('checkbox', { name: /^Allowed$/i })
          ).not.toBeChecked();
        }
      );
    }
    await actionAndCapture(
      page,
      testInfo,
      'User checks Allowed to remove the bucket-level block, and the checked state persists after reload.',
      async () => {
        const afterReload = page
          .getByRole('row')
          .filter({ hasText: /Metaboost Web E2E/i })
          .first()
          .getByRole('checkbox', { name: /^Allowed$/i });
        await afterReload.click();
        await expect(afterReload).toBeChecked({ timeout: asyncCheckboxTimeoutMs });
        await page.reload();
        await expect(
          page
            .getByRole('row')
            .filter({ hasText: /Metaboost Web E2E/i })
            .first()
            .getByRole('checkbox', { name: /^Allowed$/i })
        ).toBeChecked();
      }
    );
  });

  test('When a registry-suspended app is shown on the bucket blocked-apps tab, its Allowed checkbox is disabled and a tooltip explains why.', async ({
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
    const suspendedCheckbox = suspendedRow.getByRole('checkbox', { name: /^Allowed$/i });
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

  test('When a super-admin site-wide blocks an app, the bucket blocked-apps tab lists it only under the site-wide disclosure, not in the per-bucket table, and the disclosure is hidden again after the site-wide block is removed.', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    const globalUnmatchedText = /site-wide blocked apps \(/i;

    await page.goto('/global-blocked-apps');
    await expect(page).toHaveURL(/\/global-blocked-apps/);
    const appRowOnGlobal = page
      .getByRole('row')
      .filter({ hasText: /Metaboost Web E2E/i })
      .first();
    const siteWideForApp = appRowOnGlobal.getByRole('checkbox', { name: /blocked site-wide/i });
    if (!(await siteWideForApp.isChecked())) {
      await siteWideForApp.click();
      await expect(siteWideForApp).toBeChecked({ timeout: asyncCheckboxTimeoutMs });
    }

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=blocked`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=blocked`));
    const mainTable = page.getByRole('table').first();
    await expect(mainTable.getByRole('row').filter({ hasText: /Metaboost Web E2E/i })).toHaveCount(
      0
    );
    const disclosure = page.locator('details').filter({ has: page.getByText(globalUnmatchedText) });
    await expect(disclosure).toBeVisible();
    await expect(page.getByLabel(/apps site-wide blocked by server administrators/i)).toBeVisible();
    await disclosure.getByText(globalUnmatchedText).click();
    const siteWideTable = disclosure.getByRole('table');
    const siteWideRow = siteWideTable
      .getByRole('row')
      .filter({ hasText: /Metaboost Web E2E/i })
      .first();
    await expect(siteWideRow).toBeVisible();
    await expect(siteWideRow).toContainText(/Blocked site-wide|Bloqueada en todo el sitio/i);
    await expect(siteWideTable.getByRole('checkbox', { name: /allowed/i })).toHaveCount(0);

    await page.goto('/global-blocked-apps');
    await expect(page).toHaveURL(/\/global-blocked-apps/);
    const appRowToClear = page
      .getByRole('row')
      .filter({ hasText: /Metaboost Web E2E/i })
      .first();
    const siteWideCheckbox = appRowToClear.getByRole('checkbox', { name: /blocked site-wide/i });
    if (await siteWideCheckbox.isChecked()) {
      await siteWideCheckbox.click();
      await expect(siteWideCheckbox).not.toBeChecked({ timeout: asyncCheckboxTimeoutMs });
    }

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=blocked`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=blocked`));
    await expect(page.getByText(globalUnmatchedText)).toHaveCount(0);
  });
});
