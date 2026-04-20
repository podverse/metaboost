import { BucketBlockedAppService, BucketService } from '@metaboost/orm';

/** Blocked app IDs for the tree root of this bucket (applies to the whole hierarchy). */
export async function listBlockedAppIdsForBucket(bucketId: string): Promise<string[]> {
  const rootId = await BucketService.resolveRootBucketId(bucketId);
  if (rootId === null) {
    return [];
  }
  return BucketBlockedAppService.listAppIdsByRootBucketId(rootId);
}

export async function isAppIdBlockedForTargetBucket(
  targetBucketId: string,
  appId: string
): Promise<boolean> {
  const appIds = await listBlockedAppIdsForBucket(targetBucketId);
  return appIds.includes(appId);
}
