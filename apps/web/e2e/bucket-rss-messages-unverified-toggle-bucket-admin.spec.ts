import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission, nextFixtureName } from './helpers/advancedFixtures';
import { actionAndCapture } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mb1-channel-08.xml';
const FEED_GUID = 'e2e-mb1-channel-08-guid';

async function createTopLevelRssChannelBucket(
  page: import('@playwright/test').Page
): Promise<{ shortId: string }> {
  const response = await page.request.post('/api/buckets', {
    data: { type: 'rss-channel', rssFeedUrl: RSS_FEED_URL, isPublic: true },
  });
  expect(response.ok()).toBe(true);
  const data = (await response.json()) as { bucket?: { shortId?: string } };
  const shortId = data.bucket?.shortId;
  if (shortId === undefined || shortId === '') {
    throw new Error('Expected bucket shortId from create rss-channel response');
  }
  return { shortId };
}

async function postBoostMessage(
  page: import('@playwright/test').Page,
  bucketShortId: string,
  body: string
): Promise<string> {
  const response = await page.request.post(`/api/s/mb1/boost/${bucketShortId}`, {
    data: {
      feed_guid: FEED_GUID,
      action: 'boost',
      amount: 100,
      currency: 'BTC',
      amount_unit: 'sats',
      app_name: 'E2E App',
      sender_name: 'E2E Sender',
      sender_id: 'e2e-user-2',
      message: body,
    },
  });
  expect(response.ok()).toBe(true);
  const data = (await response.json()) as { message_guid?: string };
  if (data.message_guid === undefined || data.message_guid === '') {
    throw new Error('Expected message_guid from mb1 boost response');
  }
  return data.message_guid;
}

async function confirmBoostMessage(
  page: import('@playwright/test').Page,
  bucketShortId: string,
  messageGuid: string
): Promise<void> {
  const response = await page.request.post(`/api/s/mb1/boost/${bucketShortId}/confirm-payment`, {
    data: {
      message_guid: messageGuid,
      payment_verified_by_app: true,
    },
  });
  expect(response.ok()).toBe(true);
}

test.describe('RSS message unverified filter for bucket-admin user', () => {
  test('When the bucket-admin user views messages, they can toggle show-unverified and see additional boost messages.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    const { shortId: bucketShortId } = await createTopLevelRssChannelBucket(page);

    const verifiedMessageBody = nextFixtureName('e2e-admin-verified-boost');
    const unverifiedMessageBody = nextFixtureName('e2e-admin-unverified-boost');
    const verifiedGuid = await postBoostMessage(page, bucketShortId, verifiedMessageBody);
    await postBoostMessage(page, bucketShortId, unverifiedMessageBody);
    await confirmBoostMessage(page, bucketShortId, verifiedGuid);

    await actionAndCapture(
      page,
      testInfo,
      'Bucket-admin opens messages and sees verified-only defaults with the unverified toggle available.',
      async () => {
        await page.goto(`/bucket/${bucketShortId}?tab=messages`);
        await page.getByRole('button', { name: /message filters/i }).click();
        await expect(
          page.getByRole('checkbox', { name: /show unverified messages/i })
        ).toBeVisible();
        await expect(page.getByText(verifiedMessageBody)).toBeVisible();
        await expect(page.getByText(unverifiedMessageBody)).toHaveCount(0);
      }
    );

    await actionAndCapture(
      page,
      testInfo,
      'Bucket-admin enables show-unverified and sees unverified boost messages in addition to verified messages.',
      async () => {
        await page.getByRole('button', { name: /message filters/i }).click();
        await page.getByRole('checkbox', { name: /show unverified messages/i }).check();
        await expect(page.getByText(unverifiedMessageBody)).toBeVisible();
      }
    );
  });
});
