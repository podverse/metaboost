import { test, expect } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Dashboard-page for the bucket-owner user', () => {
  test('When the user logs in with the seeded E2E account, the dashboard-page loads and shows the dashboard heading.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the login-page before authenticating with the seeded E2E user.',
      async () => {
        await page.goto('/login');
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The login-page is fully rendered before entering credentials.'
    );
    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User fills the email or username field with the seeded E2E user identity.',
      async () => {
        await page.getByLabel(/email/i).fill('e2e-bucket-owner@example.com');
      }
    );
    await actionAndCapture(
      page,
      testInfo,
      'User fills the password field with the seeded E2E user secret.',
      async () => {
        await page.getByLabel(/password/i).fill('Test!1Aa');
      }
    );
    await actionAndCapture(
      page,
      testInfo,
      'User submits the login-form and is transitioned to the dashboard after successful authentication.',
      async () => {
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The dashboard-page is visible with the primary heading after successful login.'
    );
  });
});
