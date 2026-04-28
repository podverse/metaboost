import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';

test.describe('Bucket settings delete tab for the bucket-owner user', () => {
  test('When the user opens bucket settings on the delete tab, they see the delete bucket control and can open and dismiss the confirmation modal.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);

    await actionAndCapture(
      page,
      testInfo,
      'User opens bucket settings with the delete tab selected.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings?tab=delete`);
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${E2E_BUCKET1_ID_TEXT}/settings\\?tab=delete`)
        );
        await expect(page.getByRole('button', { name: /delete bucket/i })).toBeVisible();
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'User opens the delete confirmation modal and cancels without deleting.',
      async () => {
        await page.getByRole('button', { name: /delete bucket/i }).click();
        await expect(page.getByText(/are you sure you want to delete/i)).toBeVisible();
        await page.getByRole('button', { name: /^cancel$/i }).click();
        await expect(page.getByText(/are you sure you want to delete/i)).toHaveCount(0);
      }
    );

    await capturePageLoad(
      page,
      testInfo,
      'Bucket settings delete tab is visible after canceling the confirmation modal.'
    );
  });
});
