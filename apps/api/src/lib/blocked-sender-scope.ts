import { BucketBlockedSenderService, BucketService } from '@metaboost/orm';

/** Blocked sender GUIDs for the tree root of this bucket (applies to the whole hierarchy). */
export async function listBlockedSenderGuidsForBucket(bucketId: string): Promise<string[]> {
  const rootId = await BucketService.resolveRootBucketId(bucketId);
  if (rootId === null) {
    return [];
  }
  return BucketBlockedSenderService.listGuidsByRootBucketId(rootId);
}

export async function isSenderGuidBlockedForTargetBucket(
  targetBucketId: string,
  senderGuid: string
): Promise<boolean> {
  const guids = await listBlockedSenderGuidsForBucket(targetBucketId);
  return guids.includes(senderGuid);
}
