import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { getE2EApiV1BaseUrl } from './helpers/apiBase';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const BUCKET_LEAF_URL = '/bucket/e2ebkt000002?skipEmptyRssNetworkRedirect=1';
const BUCKET_PARENT_URL = '/bucket/e2ebkt000001?skipEmptyRssNetworkRedirect=1';
const E2E_CHILD_BUCKET_ID_TEXT = 'e2ebkt000003';

async function patchBucketNotificationPref(
  page: import('@playwright/test').Page,
  bucketIdText: string,
  body: { enabled: boolean; applyToDescendants?: boolean }
): Promise<void> {
  const response = await page.request.patch(
    `${getE2EApiV1BaseUrl()}/buckets/${bucketIdText}/notification-preference`,
    { data: body }
  );
  expect(response.ok()).toBe(true);
}

test.describe('Bucket Web Push notifications for the bucket-owner user', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['notifications']);
  });

  test('When the bucket owner opens a seeded bucket detail page, they see the notification bell button.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await actionAndCapture(
      page,
      testInfo,
      'User opens the seeded bucket detail page (no RSS empty-network redirect) and sees the notification bell.',
      async () => {
        await page.goto(BUCKET_LEAF_URL);
        await expect(
          page.getByRole('button', { name: /bucket notifications (on|off)/i })
        ).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The bucket detail page shows the notification bell control beside the bucket tabs.'
    );
  });

  test('When notification preference is saved via the API, reloading the page shows the matching bell accessibility label.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await page.goto(BUCKET_LEAF_URL);
    await patchBucketNotificationPref(page, 'e2ebkt000002', { enabled: true });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Bucket notifications on' })).toBeVisible();
    await patchBucketNotificationPref(page, 'e2ebkt000002', { enabled: false });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Bucket notifications off' })).toBeVisible();
  });

  test('When the bucket has no child buckets, the bell toggles notifications on and off without a scope modal.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await patchBucketNotificationPref(page, 'e2ebkt000002', {
      enabled: false,
      applyToDescendants: true,
    });
    await page.goto(BUCKET_LEAF_URL);
    await expect(page.getByRole('button', { name: 'Bucket notifications off' })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User enables bucket notifications on a bucket with no children and sees the bell switch to the on state.',
      async () => {
        await page.getByRole('button', { name: 'Bucket notifications off' }).click();
        await expect(page.getByRole('button', { name: 'Bucket notifications on' })).toBeVisible({
          timeout: 30_000,
        });
      }
    );
    await actionAndCapture(
      page,
      testInfo,
      'User disables bucket notifications and sees the bell switch back to the off state.',
      async () => {
        await page.getByRole('button', { name: 'Bucket notifications on' }).click();
        await expect(page.getByRole('button', { name: 'Bucket notifications off' })).toBeVisible({
          timeout: 30_000,
        });
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'After toggling off, the bucket detail page shows Bucket notifications off.'
    );
  });

  test('When the bucket has child buckets, enabling opens the scope modal and "This bucket only" completes.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await patchBucketNotificationPref(page, 'e2ebkt000001', {
      enabled: false,
      applyToDescendants: true,
    });
    await patchBucketNotificationPref(page, E2E_CHILD_BUCKET_ID_TEXT, {
      enabled: false,
      applyToDescendants: true,
    });
    await page.goto(BUCKET_PARENT_URL);
    await actionAndCapture(
      page,
      testInfo,
      'User enables notifications on a parent bucket and chooses This bucket only in the scope modal.',
      async () => {
        await page.getByRole('button', { name: 'Bucket notifications off' }).click();
        await expect(
          page.getByText(/Apply these setting changes only to this bucket/i)
        ).toBeVisible();
        await page.getByRole('button', { name: 'This bucket only' }).click();
        await expect(page.getByRole('button', { name: 'Bucket notifications on' })).toBeVisible({
          timeout: 30_000,
        });
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The parent bucket shows Bucket notifications on after scope-only enable.'
    );
  });

  test('When the bucket has child buckets, enabling with Apply to all sub-buckets turns on the descendant preference.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    await patchBucketNotificationPref(page, 'e2ebkt000001', {
      enabled: false,
      applyToDescendants: true,
    });
    await patchBucketNotificationPref(page, E2E_CHILD_BUCKET_ID_TEXT, {
      enabled: false,
      applyToDescendants: true,
    });
    await page.goto(BUCKET_PARENT_URL);
    await actionAndCapture(
      page,
      testInfo,
      'User enables notifications and chooses Apply to all sub-buckets in the scope modal.',
      async () => {
        await page.getByRole('button', { name: 'Bucket notifications off' }).click();
        await expect(
          page.getByText(/Apply these setting changes only to this bucket/i)
        ).toBeVisible();
        await page.getByRole('button', { name: 'Apply to all sub-buckets' }).click();
        await expect(page.getByRole('button', { name: 'Bucket notifications on' })).toBeVisible({
          timeout: 30_000,
        });
      }
    );
    const childPrefResponse = await page.request.get(
      `${getE2EApiV1BaseUrl()}/buckets/${E2E_CHILD_BUCKET_ID_TEXT}/notification-preference`
    );
    expect(childPrefResponse.ok()).toBe(true);
    const childPrefJson = (await childPrefResponse.json()) as { enabled?: boolean };
    expect(childPrefJson.enabled).toBe(true);
    await capturePageLoad(
      page,
      testInfo,
      'Descendant bucket notification preference is enabled after apply-to-all.'
    );
  });
});
