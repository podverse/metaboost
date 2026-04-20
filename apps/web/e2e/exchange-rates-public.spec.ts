import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Exchange-rates-page for authenticated web users', () => {
  test('When the authenticated user opens the exchange-rates-page and runs a conversion, the conversion table is visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);

    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the exchange-rates-page and sees calculator controls.',
      async () => {
        await page.goto('/exchange-rates');
        await expect(page).toHaveURL(/\/exchange-rates$/);
        await expect(page.getByRole('button', { name: /calculate/i })).toBeVisible();
      }
    );

    const currencySelect = page.getByRole('combobox').first();
    await actionAndCapture(
      page,
      testInfo,
      'User switches the source currency to EUR and submits a valid source amount in minor units.',
      async () => {
        await currencySelect.selectOption('EUR');
        await page.getByRole('spinbutton').first().fill('250');
        await page.getByRole('button', { name: /calculate/i }).click();
      }
    );

    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /currency/i })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /amount/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The exchange-rates conversion table remains visible after calculation.',
      table
    );
  });
});
