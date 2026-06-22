import type { BucketMessage, UserWebPushSubscription } from '@metaboost/orm';

import { sendNotification, setVapidDetails } from 'web-push';

import {
  BucketNotificationPreferenceService,
  BucketService,
  UserWebPushSubscriptionService,
} from '@metaboost/orm';

import { config } from '../../config/index.js';
import { logger } from '../logger.js';

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  const vapid = config.webPushVapid;
  if (vapid === null) {
    return false;
  }
  if (!vapidConfigured) {
    setVapidDetails(vapid.contact, vapid.publicKey, vapid.privateKey);
    vapidConfigured = true;
  }
  return true;
}

/** Reads HTTP status from web-push send failures (single assertion for library error shape). */
function getWebPushErrorStatusCode(err: unknown): number | undefined {
  if (err === null || typeof err !== 'object' || !('statusCode' in err)) {
    return undefined;
  }
  const status = (err as { statusCode: unknown }).statusCode;
  return typeof status === 'number' ? status : undefined;
}

export async function sendWebPushForNewBucketMessage(input: {
  bucketId: string;
  message: BucketMessage;
}): Promise<void> {
  if (!ensureVapidConfigured()) {
    return;
  }

  const preferences = await BucketNotificationPreferenceService.listByBucket(input.bucketId);
  const enabledUserIds = preferences.filter((p) => p.enabled).map((p) => p.userId);
  if (enabledUserIds.length === 0) {
    return;
  }

  const bucket = await BucketService.findById(input.bucketId);
  if (bucket === null) {
    return;
  }

  const payload = JSON.stringify({
    type: 'bucket_boost_message',
    bucketId: bucket.id,
    bucketIdText: bucket.idText,
    messageGuid: input.message.messageGuid,
  });

  /* Intersection documents batch list API; root `@metaboost/orm` typings come from `dist` — run `npm run build -w @metaboost/orm` if your IDE still shows a stale surface. */
  const subscriptionService =
    UserWebPushSubscriptionService as typeof UserWebPushSubscriptionService & {
      listByUserIds: (userIds: string[]) => Promise<UserWebPushSubscription[]>;
    };
  const subscriptions = await subscriptionService.listByUserIds(enabledUserIds);
  if (subscriptions.length === 0) {
    return;
  }

  const sendResults = await Promise.allSettled(
    subscriptions.map((sub: UserWebPushSubscription) =>
      sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keyP256dh,
            auth: sub.keyAuth,
          },
        },
        payload
      )
    )
  );

  for (let i = 0; i < sendResults.length; i++) {
    const settled = sendResults[i];
    const sub = subscriptions[i];
    if (settled === undefined || sub === undefined) {
      continue;
    }
    if (settled.status === 'fulfilled') {
      continue;
    }
    const statusCode = getWebPushErrorStatusCode(settled.reason);
    if (statusCode === 404 || statusCode === 410) {
      await UserWebPushSubscriptionService.delete(sub.id, sub.userId);
    } else {
      logger.error('webPushChannel: sendNotification failed', {
        userId: sub.userId,
        statusCode,
        err: settled.reason,
      });
    }
  }
}
