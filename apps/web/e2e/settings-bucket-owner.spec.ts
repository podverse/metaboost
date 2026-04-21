import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('User-settings-page for the bucket-owner user', () => {
  test('When an authenticated user opens the user-settings-page, they see the settings content with tabs or heading.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the user-settings-page and sees tabs or profile and password sections.',
      async () => {
        await page.goto('/settings');
        await expect(page).toHaveURL(/\/settings/);
        await expect(
          page
            .getByRole('tab', { name: /profile|general|password/i })
            .or(page.getByRole('heading', { name: /settings|profile|account/i }))
        ).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The user-settings-page is visible with tabs or heading.'
    );
  });

  test('When the authenticated bucket-owner user opens settings delete-account tab, they can open and cancel the delete-account confirmation modal.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto('/settings?tab=delete');

    await actionAndCapture(
      page,
      testInfo,
      'User sees the delete-account section in settings and opens the delete confirmation modal.',
      async () => {
        const deleteButton = page.getByRole('button', { name: /delete my account/i }).first();
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User cancels the delete confirmation modal and remains on the settings delete-account tab.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page).toHaveURL(/\/settings\?tab=delete/);
      }
    );

    await capturePageLoad(
      page,
      testInfo,
      'The settings delete-account tab remains visible after canceling account deletion.'
    );
  });

  test('When a dedicated settings-delete user confirms account deletion from settings, they are logged out and redirected to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'settings-delete-user');
    await page.goto('/login');

    await actionAndCapture(
      page,
      testInfo,
      'User logs in with the dedicated settings-delete seeded account and reaches dashboard.',
      async () => {
        await page
          .getByRole('textbox', { name: /email|username/i })
          .fill('e2e-settings-delete@example.com');
        await page.getByLabel(/password/i).fill('Test!1Aa');
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User opens settings delete-account tab, confirms delete account in the modal, and is redirected to login.',
      async () => {
        await page.goto('/settings?tab=delete');
        await expect(page).toHaveURL(/\/settings\?tab=delete/);
        await page
          .getByRole('button', { name: /delete my account/i })
          .first()
          .click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page
          .getByRole('button', { name: /delete my account/i })
          .last()
          .click();
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
      }
    );
  });

  test('When the user fills the password-tab with a mismatch and blurs the confirm field, the do-not-match message is shown and the change-password button is disabled.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto('/settings?tab=password');

    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(3);

    await actionAndCapture(
      page,
      testInfo,
      'User fills current, new, and confirm password with a mismatch and blurs the confirm field; the do-not-match message appears and the change-password button is disabled.',
      async () => {
        await passwordInputs.nth(0).fill('Test!1Aa');
        await passwordInputs.nth(1).fill('Test!1Ab');
        await passwordInputs.nth(2).fill('Test!1Ac');
        await passwordInputs.nth(2).blur();
        await expect(page).toHaveURL(/\/settings\?tab=password/);
        await expect(
          page.getByText(/passwords do not match|match|failed|error/i).first()
        ).toBeVisible();
        await expect(page.getByRole('button', { name: /change password|save/i })).toBeDisabled();
      }
    );
    const validationMessage = page.getByText(/passwords do not match|match|failed|error/i).first();
    await capturePageLoad(
      page,
      testInfo,
      'The settings-page password-tab shows do-not-match validation and the change-password button is disabled.',
      validationMessage
    );
  });

  test('When the user submits the password-tab with matching current and new password, they see success and can log in with the new password; then revert so seed user is unchanged.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto('/settings?tab=password');
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(3);
    const newPassword = 'Test!1Ab';
    await passwordInputs.nth(0).fill('Test!1Aa');
    await passwordInputs.nth(1).fill(newPassword);
    await passwordInputs.nth(2).fill(newPassword);

    await actionAndCapture(
      page,
      testInfo,
      'User submits matching current and new password and sees password-changed success.',
      async () => {
        await page.getByRole('button', { name: /change password|save/i }).click();
        await expect(page.getByText(/password changed/i).first()).toBeVisible();
        await expect(page).toHaveURL(/\/settings\?tab=password/);
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User logs out and logs in with the new password to verify the change.',
      async () => {
        await page.context().clearCookies();
        await page.goto('/login');
        await expect(page).toHaveURL(/\/login/);
        await page
          .getByRole('textbox', { name: /email|username/i })
          .fill('e2e-bucket-owner@example.com');
        await page.getByLabel(/password/i).fill(newPassword);
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User reverts password to original so seed user is unchanged for other specs.',
      async () => {
        await page.goto('/settings?tab=password');
        const inputs = page.locator('input[type="password"]');
        await expect(inputs).toHaveCount(3);
        await inputs.nth(0).fill(newPassword);
        await inputs.nth(1).fill('Test!1Aa');
        await inputs.nth(2).fill('Test!1Aa');
        await page.getByRole('button', { name: /change password|save/i }).click();
        await expect(page.getByText(/password changed/i).first()).toBeVisible();
      }
    );
  });

  test('When the user opens the settings-page with tab=password, the URL preserves the param and the password tab content is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to settings with tab=password and sees URL and password tab content.',
      async () => {
        await page.goto('/settings?tab=password');
        await expect(page).toHaveURL(/\/settings\?tab=password/);
        await expect(page.getByRole('link', { name: /password/i })).toBeVisible();
        await expect(page.locator('input[type="password"]').first()).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The settings-page shows the password tab and password content visible.'
    );
  });

  test('When the user opens the settings-page with tab=profile, the URL preserves the param and the profile tab content is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to settings with tab=profile and sees URL and profile tab content.',
      async () => {
        await page.goto('/settings?tab=profile');
        await expect(page).toHaveURL(/\/settings\?tab=profile/);
        await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /display name/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The settings-page shows the profile tab and profile content visible.'
    );
  });

  test('When the user opens the settings-page with tab=currency, the URL preserves the param and baseline-currency controls are visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to settings with tab=currency and sees baseline currency controls.',
      async () => {
        await page.goto('/settings?tab=currency');
        await expect(page).toHaveURL(/\/settings\?tab=currency/);
        await expect(page.getByRole('link', { name: /currency/i })).toBeVisible();
        await expect(page.getByRole('combobox', { name: /baseline currency/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The settings-page shows the currency tab and baseline currency controls.'
    );
  });

  test('When the user is in admin_only_username mode, the Change email tab is not visible and /settings?tab=email redirects to /settings.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User opens settings and does not see the Change email tab.',
      async () => {
        await page.goto('/settings');
        await expect(page).toHaveURL(/\/settings/);
        await expect(page.getByRole('tab', { name: /change email|email/i })).toHaveCount(0);
      }
    );
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to /settings?tab=email and is redirected to /settings; email tab still not present.',
      async () => {
        await page.goto('/settings?tab=email');
        await expect(page).toHaveURL(/\/settings$/);
        await expect(page.getByRole('tab', { name: /change email|email/i })).toHaveCount(0);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The settings-page in admin_only_username mode has no email tab and email tab URL redirects.'
    );
  });

  test('When the user opens the profile-tab and saves a display-name change, the update persists and success feedback is shown.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto('/settings?tab=profile');
    await expect(page).toHaveURL(/\/settings\?tab=profile/);
    const displayNameInput = page.getByRole('textbox', { name: /display name/i });
    await expect(displayNameInput).toBeVisible();
    const newName = `E2E Settings ${Date.now()}`;
    await displayNameInput.fill(newName);

    await actionAndCapture(
      page,
      testInfo,
      'User clicks update profile on the settings-page and sees success feedback; the new display name persists.',
      async () => {
        await page.getByRole('button', { name: /update profile|save/i }).click();
        await expect(page.getByText(/profile updated|updated successfully/i).first()).toBeVisible();
        await expect(page.getByText(new RegExp(newName, 'i')).first()).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The settings-page profile-tab shows success message and the updated display name.'
    );
  });
});
