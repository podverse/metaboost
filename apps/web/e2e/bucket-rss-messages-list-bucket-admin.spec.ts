import { expect, test } from '@playwright/test';

import { loginAsWebE2EAdminWithPermission, nextFixtureName } from './helpers/advancedFixtures';
import { getE2EApiV1BaseUrl } from './helpers/apiBase';
import { postMbrssV1Boost } from './helpers/postMbrssV1Boost';
import { actionAndCapture } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

const RSS_FEED_URL = 'http://localhost:4012/e2e/rss/mbrss-v1-channel-08.xml';
const FEED_GUID = 'e2e-mbrss-v1-channel-08-guid';

async function createTopLevelRssChannelBucket(
  page: import('@playwright/test').Page
): Promise<{ shortId: string }> {
  const response = await page.request.post(`${getE2EApiV1BaseUrl()}/buckets`, {
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
): Promise<void> {
  await postMbrssV1Boost(page.request, bucketShortId, {
    feed_guid: FEED_GUID,
    feed_title: 'E2E mbrss-v1 Channel 08',
    action: 'boost',
    amount: 100,
    currency: 'USD',
    amount_unit: 'cents',
    app_name: 'E2E App',
    sender_name: 'E2E Sender',
    sender_guid: 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    message: body,
  });
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
