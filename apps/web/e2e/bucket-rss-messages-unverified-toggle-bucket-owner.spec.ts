import { expect, test } from '@playwright/test';

import { loginAsWebE2EUserAndExpectDashboard, nextFixtureName } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mb1-channel-07.xml';
const FEED_GUID = 'e2e-mb1-channel-07-guid';

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
      amount: 42,
      currency: 'BTC',
      amount_unit: 'sats',
      app_name: 'E2E App',
      sender_name: 'E2E Sender',
      sender_id: 'e2e-user-1',
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

test.describe('RSS message unverified filter for bucket-owner user', () => {
  test('When the owner views messages, verified-only is the default and enabling show-unverified reveals additional boost messages.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-owner');
    await loginAsWebE2EUserAndExpectDashboard(page);
    const { shortId: bucketShortId } = await createTopLevelRssChannelBucket(page);

    const verifiedMessageBody = nextFixtureName('e2e-verified-boost');
    const unverifiedMessageBody = nextFixtureName('e2e-unverified-boost');
    const verifiedGuid = await postBoostMessage(page, bucketShortId, verifiedMessageBody);
    await postBoostMessage(page, bucketShortId, unverifiedMessageBody);
    await confirmBoostMessage(page, bucketShortId, verifiedGuid);

    await actionAndCapture(
      page,
      testInfo,
      'Owner opens bucket messages and sees only verified boost messages by default with the show-unverified checkbox available.',
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
      'Owner enables show-unverified and sees additional unverified boost messages alongside verified ones.',
      async () => {
        await page.getByRole('button', { name: /message filters/i }).click();
        await page.getByRole('checkbox', { name: /show unverified messages/i }).check();
        await expect(page).toHaveURL(
          new RegExp(`/bucket/${bucketShortId}\\?tab=messages.*includeUnverified=1`)
        );
        await expect(page.getByText(verifiedMessageBody)).toBeVisible();
        await expect(page.getByText(unverifiedMessageBody)).toBeVisible();
      }
    );

    await capturePageLoad(
      page,
      testInfo,
      'The messages tab shows both verified and unverified boost messages when the owner enables the unverified filter.'
    );
  });
});
