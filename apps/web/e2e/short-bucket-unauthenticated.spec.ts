import { expect, test } from '@playwright/test';

import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';
const E2E_BUCKET2_SHORT_ID = 'e2ebkt000002';

test.describe('Short-bucket (public) URL for the unauthenticated user', () => {
  test('When an unauthenticated user opens a public short-bucket URL by short id, they see the destination URL and bucket name.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the public short-bucket URL and sees the destination URL and bucket name.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}`);
        await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}`));
        await expect(page.getByText('E2E Bucket One')).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The public short-bucket-page shows the E2E Bucket One name.'
    );
  });

  test('When the user is on the public short-bucket-page, the send-message link is present.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the public short-bucket URL and the send-message link is visible.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}`);
        await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}`));
        await expect(
          page.getByRole('link', { name: /submit a message|send message/i })
        ).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The public short-bucket-page shows the send-message link.'
    );
  });

  test('When the user opens an invalid short-bucket id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to an invalid short-bucket id and sees not found.',
      async () => {
        await page.goto('/b/invalid-short-id-99999');
      }
    );
  });

  test('When the user opens a private short-bucket URL by short id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'User navigates to the private short-bucket URL and sees not found (private bucket not exposed).',
      async () => {
        await page.goto(`/b/${E2E_BUCKET2_SHORT_ID}`);
      }
    );
  });
});
