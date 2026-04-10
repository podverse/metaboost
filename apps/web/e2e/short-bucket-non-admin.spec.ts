import { expect, test } from '@playwright/test';

import { loginAsWebE2ENonAdmin } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';

test.describe('Short-bucket (public) URL for the basic-user', () => {
  test('When the basic-user opens the public short-bucket URL, they see the destination URL and bucket name (public bucket is visible to all).', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the public short-bucket URL and sees the bucket name.',
      async () => {
        await page.goto(`/b/${E2E_BUCKET1_SHORT_ID}`);
        await expect(page).toHaveURL(new RegExp(`/b/${E2E_BUCKET1_SHORT_ID}`));
        await expect(page.getByText(/E2E Bucket One/i)).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The public short-bucket-page shows the bucket name for the basic-user (public bucket).'
    );
  });
});
