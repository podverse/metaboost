import type { Bucket } from '@metaboost/orm';

import { BucketService } from '@metaboost/orm';

export type BucketAndEffective = {
  bucket: Bucket;
  /** Root (top-level) bucket; governance (owner/admins/settings) is resolved from here. */
  effectiveBucket: Bucket;
  effectiveSettings: Bucket['settings'];
  /** True when bucket is a descendant (has a parent). Descendants may only update name. */
  isDescendant: boolean;
};

/** Avoid passing non-UUID strings to findById so Postgres does not throw on invalid UUID. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve bucket by idText or id. effectiveBucket is the root ancestor (top of
 * parent chain), used for permission and settings. For root buckets,
 * effectiveBucket === bucket; for descendants, we walk up to the root.
 */
export async function getBucketAndEffective(
  idOrIdText: string
): Promise<BucketAndEffective | null> {
  const byIdText = await BucketService.findByIdText(idOrIdText);
  if (byIdText !== null) {
    const bucket = byIdText;
    let current: Bucket = bucket;
    while (current.parentBucketId !== null) {
      const parent = await BucketService.findById(current.parentBucketId);
      if (parent === null) return null;
      current = parent;
    }
    const effectiveBucket = current;
    const effectiveSettings = effectiveBucket.settings ?? null;
    const isDescendant = bucket.id !== effectiveBucket.id;
    return { bucket, effectiveBucket, effectiveSettings, isDescendant };
  }
  if (!UUID_REGEX.test(idOrIdText)) return null;
  const bucket = await BucketService.findById(idOrIdText);
  if (bucket === null) return null;
  let current: Bucket = bucket;
  while (current.parentBucketId !== null) {
    const parent = await BucketService.findById(current.parentBucketId);
    if (parent === null) return null;
    current = parent;
  }
  const effectiveBucket = current;
  const effectiveSettings = effectiveBucket.settings ?? null;
  const isDescendant = bucket.id !== effectiveBucket.id;
  return {
    bucket,
    effectiveBucket,
    effectiveSettings,
    isDescendant,
  };
}
