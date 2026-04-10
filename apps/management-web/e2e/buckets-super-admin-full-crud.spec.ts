import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { clickConfirmDeleteInModal } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management buckets-list page for the super-admin user', () => {
  test('When a permitted user (super-admin) opens the buckets-list page, they see the buckets heading and the add-bucket link.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management buckets-list page and sees the list or add-bucket CTA.',
      async () => {
        await page.goto('/buckets');
      }
    );
    await expect(page).toHaveURL(/\/buckets/);
    const bucketsHeading = page.getByRole('heading', { name: /buckets/i });
    await expect(bucketsHeading).toBeVisible();
    await expect(page.getByRole('link', { name: /add bucket|new bucket|create/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list page is visible with heading and add-bucket link.',
      bucketsHeading
    );
  });

  test('When the user clicks the add-bucket link, they are navigated to the buckets-new page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/buckets');
    await expect(page.getByRole('heading', { name: /buckets/i })).toBeVisible();
    await actionAndCapture(
      page,
      testInfo,
      'User clicks the add-bucket link and is navigated to the buckets-new page.',
      async () => {
        await page
          .getByRole('link', { name: /add bucket|new bucket|create/i })
          .first()
          .click();
      }
    );
    await expect(page).toHaveURL(/\/buckets\/new/);
    const addBucketHeading = page.getByRole('heading', { name: /add bucket/i });
    await expect(addBucketHeading).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-new page is visible after clicking the add-bucket link.',
      addBucketHeading
    );
  });

  test('When the user opens the buckets-list with query params, the params persist in the URL and the page shows the buckets list or empty state.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the buckets-list with search, page, sortBy, and sortOrder; params persist and table or empty state is visible.',
      async () => {
        await page.goto('/buckets?search=e2e&page=1&sortBy=name&sortOrder=asc');
      }
    );
    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe('/buckets');
    expect(currentUrl.searchParams.get('search')).toBe('e2e');
    expect(currentUrl.searchParams.get('page')).toBe('1');
    expect(currentUrl.searchParams.get('sortBy')).toBe('name');
    expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');
    await expect(page.getByRole('heading', { name: /buckets/i })).toBeVisible();
    const emptyState = page.getByText(/no buckets|no buckets yet/i);
    if ((await emptyState.count()) > 0) {
      await expect(emptyState.first()).toBeVisible();
    } else {
      await expect(page.getByRole('table')).toBeVisible();
    }
    await capturePageLoad(
      page,
      testInfo,
      'The buckets-list shows URL state and visible table or empty content.'
    );
  });

  test('When the user opens the delete confirmation for a created bucket on the buckets-list-page and cancels, the row remains.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/buckets/new');
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();

    const bucketName = nextFixtureName('e2e-mgmt-bucket-cancel-delete');
    await page.getByRole('textbox', { name: /name|bucket/i }).fill(bucketName);
    const ownerSelect = page.getByLabel(/owner/i);
    await expect(ownerSelect).toBeVisible();
    await ownerSelect.selectOption({ index: 1 });

    await page.getByRole('button', { name: /create bucket|add bucket|create|save/i }).click();
    await expect
      .poll(() => {
        const pathname = new URL(page.url()).pathname;
        return pathname.startsWith('/bucket/') || pathname === '/buckets';
      })
      .toBe(true);

    await page.goto(`/buckets?search=${encodeURIComponent(bucketName)}`);
    const row = page.locator('tr', { hasText: bucketName }).first();
    await expect(row).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User opens the bucket delete confirmation and clicks cancel.',
      async () => {
        await row.getByRole('button', { name: /delete/i }).click();
        const cancelButton = page
          .locator('button')
          .filter({ hasText: /cancel/i })
          .last();
        await expect(cancelButton).toBeVisible();
        await cancelButton.click();
      }
    );

    await expect(page.locator('tr', { hasText: bucketName })).toHaveCount(1);
  });

  test('When the user deletes a bucket from the buckets-list, the bucket is removed from the list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/buckets/new');
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();

    const bucketName = nextFixtureName('e2e-mgmt-bucket-delete');
    await page.getByRole('textbox', { name: /name|bucket/i }).fill(bucketName);
    const ownerSelect = page.getByLabel(/owner/i);
    await expect(ownerSelect).toBeVisible();
    await ownerSelect.selectOption({ index: 1 });

    await page.getByRole('button', { name: /create bucket|add bucket|create|save/i }).click();
    await expect
      .poll(() => {
        const pathname = new URL(page.url()).pathname;
        return pathname.startsWith('/bucket/') || pathname === '/buckets';
      })
      .toBe(true);

    await page.goto(`/buckets?search=${encodeURIComponent(bucketName)}`);
    const row = page.locator('tr', { hasText: bucketName }).first();
    await expect(row).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User deletes the created bucket from the buckets-list and confirms in the modal.',
      async () => {
        await row.getByRole('button', { name: /delete/i }).click();
        await clickConfirmDeleteInModal(page);
      }
    );

    await page.goto(`/buckets?search=${encodeURIComponent(bucketName)}`);
    await expect(page).toHaveURL(/\/buckets\?search=/);
    await expect(page.locator('tr', { hasText: bucketName })).toHaveCount(0);
    await capturePageLoad(page, testInfo, 'The buckets-list no longer shows the deleted bucket.');
  });
});
