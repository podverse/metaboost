import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard } from './helpers/advancedFixtures';
import { getE2EApiV1BaseUrl } from './helpers/apiBase';
import { postMbV1Boost } from './helpers/postMbV1Boost';
import { setE2EUserContext } from './helpers/userContext';

async function createTopLevelMbRootBucket(page: import('@playwright/test').Page): Promise<string> {
  const response = await page.request.post(`${getE2EApiV1BaseUrl()}/buckets`, {
    data: { type: 'mb-root', name: `summary-parity-${Date.now()}`, isPublic: true },
  });
  expect(response.ok()).toBe(true);
  const data = (await response.json()) as { bucket?: { idText?: string } };
  const idText = data.bucket?.idText;
  if (idText === undefined || idText === '') {
    throw new Error('Expected bucket idText from create mb-root response');
  }
  return idText;
}

test.describe('bucket summary timezone parity', () => {
  test('When one boost message exists in a bucket, the summary message count is not zero and matches the list context.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const bucketIdText = await createTopLevelMbRootBucket(page);

    await postMbV1Boost(page.request, bucketIdText, {
      currency: 'BTC',
      amount: 44,
      amount_unit: 'satoshis',
      action: 'boost',
      app_name: 'metaboost-e2e',
      sender_guid: 'sender-guid-summary-parity',
      message: 'summary parity check',
    });

    await page.goto(`/bucket/${bucketIdText}`);
    await expect(page.getByText('summary parity check')).toBeVisible();
    await expect(page.getByText(/Messages:\s*1\b/)).toBeVisible();
  });
});
