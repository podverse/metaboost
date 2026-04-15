import type { Bucket } from '@metaboost/orm';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH } from '@metaboost/helpers';

export type BucketJson = {
  id: string;
  shortId: string;
  ownerId: string;
  ownerDisplayName?: string | null;
  name: string;
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
};

export type BucketToJsonOverrides = {
  ownerId?: string;
  ownerDisplayName?: string | null;
  messageBodyMaxLength?: number;
  lastMessageAt?: string | null;
};

/** Shape bucket for management API responses. Use overrides for child buckets (inherited from parent). */
export function bucketToJson(
  bucket: Bucket,
  ownerDisplayName?: string | null,
  overrides?: BucketToJsonOverrides
): BucketJson {
  const resolvedOwnerDisplayName =
    overrides?.ownerDisplayName !== undefined ? overrides.ownerDisplayName : ownerDisplayName;
  const base: BucketJson = {
    id: bucket.id,
    shortId: bucket.shortId,
    ownerId: overrides?.ownerId ?? bucket.ownerId,
    ...(resolvedOwnerDisplayName !== undefined && { ownerDisplayName: resolvedOwnerDisplayName }),
    name: bucket.name,
    isPublic: bucket.isPublic,
    parentBucketId: bucket.parentBucketId,
    messageBodyMaxLength:
      overrides?.messageBodyMaxLength !== undefined
        ? overrides.messageBodyMaxLength
        : (bucket.settings?.messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH),
    createdAt: bucket.createdAt.toISOString(),
    updatedAt: bucket.updatedAt.toISOString(),
  };
  if (overrides?.lastMessageAt !== undefined) {
    return { ...base, lastMessageAt: overrides.lastMessageAt };
  }
  return base;
}
