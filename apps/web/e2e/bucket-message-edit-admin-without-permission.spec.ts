import { expect, test } from '@playwright/test';

import {
  loginAsWebE2EAdminWithoutPermission,
  loginAsWebE2EUserAndExpectDashboard,
} from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

async function createMessageAndGetId(page: import('@playwright/test').Page): Promise<string> {
  const body = `e2e-web-denied-message-${Date.now()}`;
  await loginAsWebE2EUserAndExpectDashboard(page);
  await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}/send-message`);
  await expect(page.getByRole('textbox', { name: /your name/i })).toBeVisible();
  await page.getByRole('textbox', { name: /your name/i }).fill('E2E Sender');
  await page.getByRole('textbox', { name: /message/i }).fill(body);
  await page.getByRole('button', { name: /send|submit/i }).click();
  await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}$`));
  await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages`);
  const editLink = page.getByRole('link', { name: /edit/i }).first();
  await expect(editLink).toBeVisible();
  const href = await editLink.getAttribute('href');
  const match = href?.match(/\/messages\/([^/]+)\/edit$/);
  if (match === null || match === undefined || match[1] === undefined || match[1] === '') {
    throw new Error(`Could not extract message id from href: ${href ?? 'null'}`);
  }
  return match[1];
}

test.describe('Bucket-message-edit-page for the bucket-admin (settings:- roles:- messages:- admins:-) user', () => {
  test('When the bucket-admin (settings:- roles:- messages:- admins:-) without message update permission opens the bucket-message-edit-page, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin (settings:- roles:- messages:- admins:-)');
    const messageId = await createMessageAndGetId(page);
    await page.context().clearCookies();
    await loginAsWebE2EAdminWithoutPermission(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-message-edit-page and sees not found (no message update permission).',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_SHORT_ID}/messages/${messageId}/edit`);
      }
    );
  });
});
