import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_USERNAME = 'e2e-superadmin';
const E2E_PASSWORD = 'Test!1Aa';

test.describe('Management login-page for the super-admin user', () => {
  test('When the user submits valid credentials, they are redirected to the dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await actionAndCapture(
      page,
      testInfo,
      'User fills username and password with the super-admin and submits.',
      async () => {
        await page.goto('/login');
        await expect(page.getByRole('textbox', { name: /username|email/i })).toBeVisible();
        await page.getByRole('textbox', { name: /username|email/i }).fill(E2E_USERNAME);
        await page.getByLabel(/password/i).fill(E2E_PASSWORD);
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management dashboard-page is visible after successful login with the super-admin.'
    );
  });

  test('When an authenticated user visits the login-page, they are redirected to the dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await actionAndCapture(
      page,
      testInfo,
      'User logs in with the super-admin first to establish a session.',
      async () => {
        await page.goto('/login');
        await page.getByRole('textbox', { name: /username|email/i }).fill(E2E_USERNAME);
        await page.getByLabel(/password/i).fill(E2E_PASSWORD);
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
      }
    );
    await expect(page).toHaveURL(/\/dashboard/);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the login-page while authenticated and is redirected to the dashboard.',
      async () => {
        await page.goto('/login');
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The dashboard-page is visible after already-authenticated redirect from the login-page.'
    );
  });
});
