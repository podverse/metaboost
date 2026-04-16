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

test.describe('RSS bucket messages list for bucket-admin user', () => {
  test('When the bucket-admin user views messages, submitted boost messages appear in the list.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'bucket-admin');
    await loginAsWebE2EAdminWithPermission(page);
    const { shortId: bucketShortId } = await createTopLevelRssChannelBucket(page);

    const firstBoostBody = nextFixtureName('e2e-admin-boost-a');
    const secondBoostBody = nextFixtureName('e2e-admin-boost-b');
    await postBoostMessage(page, bucketShortId, firstBoostBody);
    await postBoostMessage(page, bucketShortId, secondBoostBody);

    await actionAndCapture(
      page,
      testInfo,
      'Bucket-admin opens messages and sees all submitted boost messages.',
      async () => {
        await page.goto(`/bucket/${bucketShortId}?tab=messages`);
        await expect(page.getByText(firstBoostBody)).toBeVisible();
        await expect(page.getByText(secondBoostBody)).toBeVisible();
      }
    );
  });
});
