import { expect, test } from '@playwright/test';

import { actionAndCapture } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('How-to pages for the unauthenticated user', () => {
  test('When an unauthenticated user opens the creators how-to page, they can read it without login redirect.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User visits the creators how-to page while unauthenticated and sees onboarding content.',
      async () => {
        await page.goto('/how-to/creators');
        await expect(page).toHaveURL(/\/how-to\/creators$/);
        await expect(page.getByRole('heading', { name: 'How-To for Creators' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
      }
    );
  });

  test('When an unauthenticated user opens the developers how-to page, they can read it without login redirect.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User visits the developers how-to page while unauthenticated and sees integration guidance.',
      async () => {
        await page.goto('/how-to/developers');
        await expect(page).toHaveURL(/\/how-to\/developers$/);
        await expect(page.getByRole('heading', { name: 'How-To for Developers' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
      }
    );
  });
});
