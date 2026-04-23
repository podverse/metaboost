import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Terms-required flow for seeded users', () => {
  test('When a user without latest terms acceptance logs in and agrees, they are gated then redirected to dashboard.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'terms-accept-user');
    await actionAndCapture(
      page,
      testInfo,
      'User logs in with a seeded account that has not accepted latest terms and is redirected to the required terms page.',
      async () => {
        await page.goto('/login');
        await page
          .getByRole('textbox', { name: /email|username/i })
          .fill('e2e-terms-accept@example.com');
        await page.getByLabel(/password/i).fill('Test!1Aa');
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
        await expect(page).toHaveURL(/\/terms-required/);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The required terms page is visible immediately after login.'
    );
    await actionAndCapture(
      page,
      testInfo,
      'The persistent terms reminder banner is not shown on the required-terms page for a first-time acceptor (redundant with the full agreement flow on this page).',
      async () => {
        await expect(
          page.getByText('continue receiving Metaboost messages.', { exact: false })
        ).not.toBeVisible();
        await expect(
          page.getByRole('link', { name: /review and accept terms/i })
        ).not.toBeVisible();
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User checks the agreement checkbox and submits the terms form to continue.',
      async () => {
        await page.getByRole('checkbox', { name: /i agree to the terms of service/i }).check();
        await page.getByRole('button', { name: /i agree and continue/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByText('24h', { exact: true }).first()).toBeVisible();
        await expect(
          page.getByText('continue receiving Metaboost messages.', { exact: false })
        ).not.toBeVisible();
      }
    );
  });

  test('When a user without latest terms acceptance chooses delete in More Options, their account is deleted and they are returned to login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'terms-delete-user');
    await actionAndCapture(
      page,
      testInfo,
      'User logs in with a seeded account that has not accepted latest terms and lands on required terms.',
      async () => {
        await page.goto('/login');
        await page
          .getByRole('textbox', { name: /email|username/i })
          .fill('e2e-terms-delete@example.com');
        await page.getByLabel(/password/i).fill('Test!1Aa');
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
        await expect(page).toHaveURL(/\/terms-required/);
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User expands More Options, starts account deletion, confirms in the modal, and returns to login.',
      async () => {
        await page.getByRole('button', { name: /show more options/i }).click();
        await page
          .getByRole('button', { name: /delete my account/i })
          .first()
          .click();
        await expect(page.getByText(/are you sure you want to delete/i)).toBeVisible();
        await page
          .getByRole('button', { name: /delete my account/i })
          .last()
          .click();
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
      }
    );
  });
});
