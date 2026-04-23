import { expect, test } from '@playwright/test';

import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_EMAIL = 'e2e-terms-upcoming-ux@example.com';
const E2E_PASSWORD = 'Test!1Aa';

test.describe('Terms page when upcoming terms require acceptance', () => {
  test('When a user has passed-enforcement latest terms to accept, opening /terms shows the agreement flow with checkbox, continue, and more options just like the terms-required page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'terms-upcoming-ux-user');
    await actionAndCapture(
      page,
      testInfo,
      'User logs in with the seeded terms-upcoming-ux account (no prior acceptance) and is redirected to the terms-required page because latest terms acceptance is enforced.',
      async () => {
        await page.goto('/login');
        await page.getByRole('textbox', { name: /email|username/i }).fill(E2E_EMAIL);
        await page.getByLabel(/password/i).fill(E2E_PASSWORD);
        await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
        await expect(page).toHaveURL(/\/terms-required/);
        await expect(
          page.getByRole('heading', { name: /agree to terms of service/i })
        ).toBeVisible();
        await expect(
          page.getByRole('checkbox', { name: /i agree to the terms of service/i })
        ).toBeVisible();
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User opens the terms-page route directly and sees the same acceptance layout as terms-required instead of the browse view.',
      async () => {
        await page.goto('/terms');
        await expect(page).toHaveURL(/\/terms$/);
        await expect(
          page.getByRole('heading', { name: /agree to terms of service/i })
        ).toBeVisible();
        await expect(page.getByText('E2E seeded terms body (en-US).')).toBeVisible();
        await expect(page.getByRole('heading', { name: /your accepted terms/i })).not.toBeVisible();
        await expect(
          page.getByRole('checkbox', { name: /i agree to the terms of service/i })
        ).toBeVisible();
        await page.getByRole('checkbox', { name: /i agree to the terms of service/i }).check();
        await expect(page.getByRole('button', { name: /show more options/i })).toBeVisible();
        await page.getByRole('button', { name: /i agree and continue/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByText('24h', { exact: true }).first()).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'After accepting the upcoming terms from /terms, the user is on the dashboard with the bucket summary range control visible.'
    );
  });
});
