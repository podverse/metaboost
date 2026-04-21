import { expect, test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { setE2EUserContext } from './helpers/userContext';

test.describe('New-bucket-page for the basic-user', () => {
  test('When the basic-user opens the new-bucket-page, they see the new-bucket form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await page.goto('/buckets/new');
    await expect(page).toHaveURL(/\/buckets\/new/);
    await expect(page.getByRole('heading', { name: /new bucket/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /rss feed url/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add bucket|create|save/i })).toBeVisible();
  });
});
