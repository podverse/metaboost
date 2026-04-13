import { expect, test } from '@playwright/test';

import { actionAndCapture } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Terms page for the unauthenticated user', () => {
  test('When an unauthenticated user visits the terms-page, they can read policy and disclaimer content without login.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User opens the terms-page while not logged in and can read service and payment disclaimers.',
      async () => {
        await page.goto('/terms');
        await expect(page).toHaveURL(/\/terms$/);
        await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
        await expect(
          page.getByText(
            'A message does not guarantee that a payment was sent, settled, or received.',
            { exact: false }
          )
        ).toBeVisible();
        await expect(
          page.getByText(
            'MetaBoost does not issue refunds. Payment disputes must be handled between the message sender, the content creator, and the payment service provider.',
            { exact: false }
          )
        ).toBeVisible();
      }
    );
  });
});
