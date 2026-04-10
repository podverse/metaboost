import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management buckets-new page for the super-admin user', () => {
  test('When a permitted user (super-admin) opens the buckets-new page, they see the add-bucket form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management buckets-new page and sees the add-bucket form.',
      async () => {
        await page.goto('/buckets/new');
      }
    );
    await expect(page).toHaveURL(/\/buckets\/new/);
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add bucket|create|save/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The management add-bucket form is visible with name and submit button.'
    );
  });

  test('When the super-admin navigates from the buckets-list to the new-bucket page via the add-bucket link, they see the add-bucket form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/buckets');
    await expect(page).toHaveURL(/\/buckets(\?|$)/);
    const addBucketLink = page.getByRole('link', { name: /add bucket|new bucket/i });
    await expect(addBucketLink).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks the add-bucket link and is taken to the buckets-new page.',
      async () => {
        await addBucketLink.click();
      }
    );
    await expect(page).toHaveURL(/\/buckets\/new/);
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The add-bucket form is visible after navigating from the buckets-list.'
    );
  });

  test('When the user submits the new-bucket form without required fields, validation is shown and they remain on the page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/buckets/new');
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User submits the empty management bucket create form and sees validation.',
      async () => {
        await page.getByRole('button', { name: /create bucket|add bucket|create|save/i }).click();
      }
    );
    await expect(page).toHaveURL(/\/buckets\/new/);
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/owner is required/i)).toBeVisible();
    await capturePageLoad(page, testInfo, 'The form remains on the page with validation visible.');
  });

  test('When the user clicks Cancel on the new-bucket form, they are returned to the buckets-list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/buckets/new');
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on the management bucket create form and is taken to the buckets-list.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page).toHaveURL(/\/buckets(\?|$)/);
      }
    );
    await capturePageLoad(page, testInfo, 'The buckets-list is visible after Cancel.');
  });

  test('When the user submits a valid bucket create form, they are redirected to the bucket surface and the new bucket appears in the list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/buckets/new');
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();

    const bucketName = nextFixtureName('e2e-mgmt-bucket');
    await page.getByRole('textbox', { name: /name|bucket/i }).fill(bucketName);

    const ownerSelect = page.getByLabel(/owner/i);
    await expect(ownerSelect).toBeVisible();
    await ownerSelect.selectOption({ index: 1 });

    await actionAndCapture(
      page,
      testInfo,
      'User submits the valid management bucket create form and is redirected.',
      async () => {
        await page.getByRole('button', { name: /create bucket|add bucket|create|save/i }).click();
        await expect
          .poll(() => {
            const pathname = new URL(page.url()).pathname;
            return pathname.startsWith('/bucket/') || pathname === '/buckets';
          })
          .toBe(true);
      }
    );
    await expect(page.getByText(new RegExp(bucketName, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The new bucket is visible on the bucket surface or buckets-list.'
    );
  });
});
