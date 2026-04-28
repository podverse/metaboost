import { test } from '@playwright/test';

import { expectInvalidRouteShowsNotFound } from './helpers/flowHelpers';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';
const E2E_BUCKET2_ID_TEXT = 'e2ebkt000002';

test.describe('Short-bucket (public) URL for the unauthenticated user', () => {
  test('When an unauthenticated user opens a short-bucket URL by short id, they see not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'Unauthenticated user navigates to removed short-bucket URL and sees not found.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_ID_TEXT}`);
      }
    );
  });

  test('When the unauthenticated user opens the same short-bucket URL, it remains not found.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'unauthenticated');
    await expectInvalidRouteShowsNotFound(
      page,
      testInfo,
      'Unauthenticated user repeats removed short-bucket navigation and still sees not found.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_ID_TEXT}`);
      }
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
        await page.goto(`/b/${E2E_BUCKET2_ID_TEXT}`);
      }
    );
  });
});
