import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_EMAIL = 'e2e-bucket-owner@example.com';
const E2E_PASSWORD = 'Test!1Aa';

test.describe('Login-page for the bucket-owner user', () => {
  test('When an authenticated user visits the login-page, they are redirected to the dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await actionAndCapture(
      page,
      testInfo,
      'User logs in with the seeded user first to establish a session.',
      async () => {
        await page.goto('/login');
        await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
        await page.getByRole('textbox', { name: /email|username/i }).fill(E2E_EMAIL);
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
      'The dashboard is visible after already-authenticated redirect from the login-page.'
    );
  });
});
