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

  test('When the super-admin updates the minimum message threshold on currency settings, the saved value persists and the messages tab remains accessible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);
    const minimumUsdCentsInput = page.getByRole('spinbutton', {
      name: /minimum message amount/i,
    });
    await expect(minimumUsdCentsInput).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User sets a non-zero minimum message amount threshold and saves management bucket currency settings.',
      async () => {
        await minimumUsdCentsInput.fill('250');
        await page.getByRole('button', { name: /save/i }).click();
      }
    );
    await expect(page.getByRole('spinbutton', { name: /minimum message amount/i })).toHaveValue(
      '250'
    );

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/settings\\?tab=currency`));
    await expect(page.getByRole('spinbutton', { name: /minimum message amount/i })).toHaveValue(
      '250'
    );

    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket detail messages tab after saving the threshold and the messages panel remains visible.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}?tab=messages`);
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}`));
        await expect(page.getByLabel(/^sort$/i)).toBeVisible();
      }
    );

    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);
    await page.getByRole('spinbutton', { name: /minimum message amount/i }).fill('0');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('spinbutton', { name: /minimum message amount/i })).toHaveValue(
      '0'
    );
  });

  test('When the super-admin changes currency settings for a bucket with descendants, they are prompted to choose settings scope before save completes.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/settings?tab=currency`);

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
        await expect(page.getByRole('heading', { name: 'Blocked apps' })).toBeVisible();
        await expect(page.getByText(/nested buckets|Global blocked apps page/i)).toBeVisible();
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
          await allowedCheckbox.uncheck();
          await expect(allowedCheckbox).not.toBeChecked();
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
        await afterReload.check();
        await expect(afterReload).toBeChecked();
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
});
