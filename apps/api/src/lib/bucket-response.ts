import type { Bucket } from '@boilerplate/orm';

export type BucketResponseOverrides = {
  messageBodyMaxLength?: number | null;
  ownerId?: string;
  /** When set (e.g. for child-bucket list), include last message date (ISO string). */
  lastMessageAt?: string | null;
};

/** Shape bucket for GET /buckets/:id and list; keeps messageBodyMaxLength at top level from settings. */
export function toBucketResponse(
  bucket: Bucket,
  overrides?: BucketResponseOverrides
): {
  id: string;
  shortId: string;
  ownerId: string;
  name: string;
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: string | null;
} {
  const base = {
    id: bucket.id,
    shortId: bucket.shortId,
    ownerId: overrides?.ownerId ?? bucket.ownerId,
    name: bucket.name,
    isPublic: bucket.isPublic,
    parentBucketId: bucket.parentBucketId,
    messageBodyMaxLength:
      overrides?.messageBodyMaxLength !== undefined
        ? overrides.messageBodyMaxLength
        : (bucket.settings?.messageBodyMaxLength ?? null),
    createdAt: bucket.createdAt,
    updatedAt: bucket.updatedAt,
  };
  if (overrides?.lastMessageAt !== undefined) {
    return { ...base, lastMessageAt: overrides.lastMessageAt };
  }
  return base;
}

export type PublicBucketAncestor = { shortId: string; name: string };

/** Shape bucket for public GET /buckets/public/:id. */
export function toPublicBucketResponse(
  bucket: Bucket,
  overrides?: Pick<BucketResponseOverrides, 'messageBodyMaxLength'>,
  ancestors: PublicBucketAncestor[] = []
): {
  id: string;
  shortId: string;
  name: string;
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number | null;
  ancestors: PublicBucketAncestor[];
} {
  return {
    id: bucket.id,
    shortId: bucket.shortId,
    name: bucket.name,
    isPublic: bucket.isPublic,
    parentBucketId: bucket.parentBucketId,
    messageBodyMaxLength:
      overrides?.messageBodyMaxLength !== undefined
        ? overrides.messageBodyMaxLength
        : (bucket.settings?.messageBodyMaxLength ?? null),
    ancestors,
  };
}
