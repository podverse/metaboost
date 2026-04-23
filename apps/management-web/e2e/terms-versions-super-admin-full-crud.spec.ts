import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

type E2ETermsVersion = {
  id: string;
  versionKey: string;
  status: 'draft' | 'upcoming' | 'current' | 'deprecated';
};

async function listTermsVersions(
  page: import('@playwright/test').Page
): Promise<E2ETermsVersion[]> {
  const response = await page.request.get('/api/management/v1/terms-versions');
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { termsVersions?: E2ETermsVersion[] };
  return payload.termsVersions ?? [];
}

async function promoteUpcomingIfPresent(page: import('@playwright/test').Page): Promise<void> {
  const versions = await listTermsVersions(page);
  const existingUpcoming = versions.find((item) => item.status === 'upcoming');
  if (existingUpcoming === undefined) {
    return;
  }
  const promoteResponse = await page.request.post(
    `/api/management/v1/terms-versions/${existingUpcoming.id}/promote-to-current`
  );
  expect(promoteResponse.ok()).toBeTruthy();
}

test.describe('Management terms-versions-page for the super-admin user', () => {
  test('When the super-admin manages terms versions, they can create one upcoming version, cannot create a second upcoming version, and can promote upcoming to current.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);

    await promoteUpcomingIfPresent(page);
    const beforeVersions = await listTermsVersions(page);
    const previousCurrent = beforeVersions.find((item) => item.status === 'current');
    expect(previousCurrent).toBeDefined();

    await actionAndCapture(
      page,
      testInfo,
      'User opens the terms-versions list and sees the page heading.',
      async () => {
        await page.goto('/terms-versions');
        await expect(page).toHaveURL(/\/terms-versions/);
        await expect(page.getByRole('heading', { name: /terms versions/i })).toBeVisible();
      }
    );

    const versionKey = nextFixtureName('e2e-terms-upcoming');
    const secondVersionKey = nextFixtureName('e2e-terms-upcoming-blocked');
    const title = `E2E Terms ${versionKey}`;
    /** Second form: keep within API title max (SHORT_TEXT_MAX_LENGTH 50); do not use `E2E Terms ${secondVersionKey}` or Joi rejects with 400. */
    const secondTitle = 'E2E second upcoming block';
    const today = new Date();
    const inTwoDays = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const announcement = new Date(today.getTime() + 60 * 60 * 1000);
    const enforcementValue = inTwoDays.toISOString().slice(0, 16);
    const announcementValue = announcement.toISOString().slice(0, 16);

    await actionAndCapture(
      page,
      testInfo,
      'User opens the new terms-version form and creates an upcoming terms version.',
      async () => {
        await page.goto('/terms-versions/new');
        await expect(page.getByRole('heading', { name: /add terms version/i })).toBeVisible();
        await page.getByRole('textbox', { name: /version key/i }).fill(versionKey);
        await page.getByRole('textbox', { name: /^title$/i }).fill(title);
        await page
          .getByRole('textbox', { name: /terms content \(en-us\)/i })
          .fill(`Terms content for ${versionKey}.`);
        await page
          .getByRole('textbox', { name: /terms content \(es\)/i })
          .fill(`Contenido de términos para ${versionKey}.`);
        await page.getByLabel(/announcement starts at/i).fill(announcementValue);
        await page.getByLabel(/enforcement starts at/i).fill(enforcementValue);
        await page.getByLabel(/^status$/i).selectOption('upcoming');
        await page.getByRole('button', { name: /create terms version/i }).click();
      }
    );

    await expect(page).toHaveURL(/\/terms-versions$/);
    await expect(page.getByRole('heading', { name: /terms versions/i })).toBeVisible();

    const afterCreateVersions = await listTermsVersions(page);
    const created = afterCreateVersions.find((item) => item.versionKey === versionKey);
    expect(created).toBeDefined();
    const createdTermsId = created?.id ?? '';
    expect(createdTermsId).not.toBe('');

    await actionAndCapture(
      page,
      testInfo,
      'User attempts to create a second upcoming terms version and sees the one-upcoming validation error.',
      async () => {
        await page.goto('/terms-versions/new');
        await page.getByRole('textbox', { name: /version key/i }).fill(secondVersionKey);
        await page.getByRole('textbox', { name: /^title$/i }).fill(secondTitle);
        await page
          .getByRole('textbox', { name: /terms content \(en-us\)/i })
          .fill(`Terms content for ${secondVersionKey}.`);
        await page
          .getByRole('textbox', { name: /terms content \(es\)/i })
          .fill(`Contenido de términos para ${secondVersionKey}.`);
        await page.getByLabel(/announcement starts at/i).fill(announcementValue);
        await page.getByLabel(/enforcement starts at/i).fill(enforcementValue);
        await page.getByLabel(/^status$/i).selectOption('upcoming');
        await page.getByRole('button', { name: /create terms version/i }).click();
      }
    );
    await expect(page.getByText(/only one upcoming terms version is allowed/i)).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User opens the created upcoming terms version edit form and promotes it to current.',
      async () => {
        await page.goto(`/terms-version/${createdTermsId}/edit`);
        await expect(
          page.getByRole('heading', { name: new RegExp(`edit terms version:.*${versionKey}`, 'i') })
        ).toBeVisible();
        await page.getByRole('button', { name: /promote to current/i }).click();
      }
    );
    await expect
      .poll(async () => {
        const versions = await listTermsVersions(page);
        return versions.find((item) => item.id === createdTermsId)?.status;
      })
      .toBe('current');

    await page.goto(`/terms-version/${previousCurrent?.id ?? ''}/edit`);
    await expect
      .poll(async () => {
        const versions = await listTermsVersions(page);
        return versions.find((item) => item.id === previousCurrent?.id)?.status;
      })
      .toBe('deprecated');

    await capturePageLoad(
      page,
      testInfo,
      'The previous current terms version is visible as deprecated after promoting the upcoming version.'
    );
  });
});
