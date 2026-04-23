import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID = 'e2ebkt000001';

test.describe('Management bucket-child-new-page for the super-admin user', () => {
  test('When the super-admin opens the bucket-child-new page with an invalid parent bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the bucket-child-new page with an invalid parent bucket id and sees not found.',
      async () => {
        await page.goto('/bucket/99999999-9999-4999-a999-999999999999/new');
      }
    );
  });

  test('When a permitted user (super-admin) opens the bucket-child-new page, they see the child-bucket create form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the bucket-child-new page and sees the create form.',
      async () => {
        await page.goto(`/bucket/${E2E_BUCKET1_ID}/new`);
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/new`));
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add bucket|create|save/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-child-new form is visible with name and submit button.'
    );
  });

  test('When the super-admin navigates from the bucket-detail Buckets tab to the child-new page via the Add bucket link, they see the child-bucket create form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}?tab=buckets`);
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}`));
    const addBucketLink = page.getByRole('link', { name: /add bucket/i });
    await expect(addBucketLink).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks the Add bucket link and is taken to the bucket-child-new page.',
      async () => {
        await addBucketLink.click();
      }
    );
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/new`));
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The bucket-child-new form is visible after navigating from bucket-detail.'
    );
  });

  test('When the user submits the child-bucket form with an empty name, a validation error is shown.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/new`);
    await expect(page.getByRole('textbox', { name: /name|bucket/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User submits the form with an empty name and sees a validation error.',
      async () => {
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
      }
    );
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}/new`));
    await capturePageLoad(
      page,
      testInfo,
      'The form remains on the page with validation error visible.'
    );
  });

  test('When the user submits the child-bucket form with a valid name, they are redirected to the parent bucket Buckets tab and the new bucket appears in the list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    const childName = nextFixtureName('e2e-child-bucket');
    await page.goto(`/bucket/${E2E_BUCKET1_ID}/new`);
    await page.getByRole('textbox', { name: /name|bucket/i }).fill(childName);

    await actionAndCapture(
      page,
      testInfo,
      'User submits the form with a valid name and is redirected to the parent bucket Buckets tab with the new bucket in the list.',
      async () => {
        await page.getByRole('button', { name: /add bucket|create|save/i }).click();
        await expect(page).toHaveURL(new RegExp(`/bucket/${E2E_BUCKET1_ID}`));
      }
    );
    await page.goto(`/bucket/${E2E_BUCKET1_ID}?tab=buckets`);
    await expect(page.getByText(childName).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The parent bucket Buckets tab shows the newly created child bucket.'
    );
  });
});
