import type { BucketMessage } from '@metaboost/orm';

import { BucketService } from '@metaboost/orm';

import { boostMessageMeetsRootPublicMinimumThreshold } from '../message-threshold-filter.js';
import { sendWebPushForNewBucketMessage } from './webPushChannel.js';

/**
 * Channel-neutral hook for new bucket messages. Web Push is the first channel;
 * additional transports can subscribe here later.
 */
export async function notifyNewBucketMessage(input: {
  bucketId: string;
  message: BucketMessage;
}): Promise<void> {
  const rootBucketId = await BucketService.resolveRootBucketId(input.bucketId);
  if (rootBucketId === null) {
    return;
  }
  const meetsThreshold = await boostMessageMeetsRootPublicMinimumThreshold({
    rootBucketId,
    message: input.message,
  });
  if (!meetsThreshold) {
    return;
  }
  await sendWebPushForNewBucketMessage({
    bucketId: input.bucketId,
    message: input.message,
  });
}
