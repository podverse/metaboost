import { expect, test } from '@playwright/test';

import { actionAndCapture } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Terms page for the unauthenticated user', () => {
  test('When an unauthenticated user visits the terms-page, they see a login prompt for user-specific terms status.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User opens the terms-page while not logged in and is prompted to sign in to view account-specific terms.',
      async () => {
        await page.goto('/terms');
        await expect(page).toHaveURL(/\/terms$/);
        await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
        await expect(
          page.getByText('Sign in to view your current terms and upcoming terms changes.')
        ).toBeVisible();
        await expect(page.getByRole('link', { name: /go to login/i })).toBeVisible();
      }
    );
  });
});
