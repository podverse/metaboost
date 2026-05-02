import type { Bucket } from '@metaboost/orm';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH } from '@metaboost/helpers';

import { config } from '../config/index.js';

export type BucketResponseOverrides = {
  messageBodyMaxLength?: number;
  preferredCurrency?: string;
  publicBoostDisplayMinimumMinor?: number;
  ownerId?: string;
  /** When set (e.g. for child-bucket list), include last message date (ISO string). */
  lastMessageAt?: string | null;
};

function toConversionEndpointUrl(bucketIdText: string): string {
  return `${config.apiPublicBaseUrl}${config.apiVersionPath}/buckets/public/${bucketIdText}/conversion`;
}

/** Shape bucket for GET /buckets/:id and list; keeps messageBodyMaxLength at top level from settings. */
export function toBucketResponse(
  bucket: Bucket,
  overrides?: BucketResponseOverrides
): {
  id: string;
  idText: string;
  ownerId: string;
  name: string;
  type: Bucket['type'];
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number;
  preferredCurrency: string;
  publicBoostDisplayMinimumMinor: number;
  conversionEndpointUrl: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: string | null;
} {
  const base = {
    id: bucket.id,
    idText: bucket.idText,
    ownerId: overrides?.ownerId ?? bucket.ownerId,
    name: bucket.name,
    type: bucket.type,
    isPublic: bucket.isPublic,
    parentBucketId: bucket.parentBucketId,
    messageBodyMaxLength:
      overrides?.messageBodyMaxLength !== undefined
        ? overrides.messageBodyMaxLength
        : (bucket.settings?.messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH),
    preferredCurrency:
      overrides?.preferredCurrency !== undefined
        ? overrides.preferredCurrency
        : (bucket.settings?.preferredCurrency ?? 'USD'),
    publicBoostDisplayMinimumMinor:
      overrides?.publicBoostDisplayMinimumMinor !== undefined
        ? overrides.publicBoostDisplayMinimumMinor
        : (bucket.settings?.publicBoostDisplayMinimumMinor ?? 0),
    conversionEndpointUrl: toConversionEndpointUrl(bucket.idText),
    createdAt: bucket.createdAt,
    updatedAt: bucket.updatedAt,
  };
  if (overrides?.lastMessageAt !== undefined) {
    return { ...base, lastMessageAt: overrides.lastMessageAt };
  }
  return base;
}

export type PublicBucketAncestor = { idText: string; name: string };

/** Shape bucket for public GET /buckets/public/:id. */
export function toPublicBucketResponse(
  bucket: Bucket,
  overrides?: Pick<
    BucketResponseOverrides,
    'messageBodyMaxLength' | 'preferredCurrency' | 'publicBoostDisplayMinimumMinor'
  >,
  ancestors: PublicBucketAncestor[] = []
): {
  id: string;
  idText: string;
  name: string;
  type: Bucket['type'];
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number;
  preferredCurrency: string;
  publicBoostDisplayMinimumMinor: number;
  conversionEndpointUrl: string;
  ancestors: PublicBucketAncestor[];
} {
  return {
    id: bucket.id,
    idText: bucket.idText,
    name: bucket.name,
    type: bucket.type,
    isPublic: bucket.isPublic,
    parentBucketId: bucket.parentBucketId,
    messageBodyMaxLength:
      overrides?.messageBodyMaxLength !== undefined
        ? overrides.messageBodyMaxLength
        : (bucket.settings?.messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH),
    preferredCurrency:
      overrides?.preferredCurrency !== undefined
        ? overrides.preferredCurrency
        : (bucket.settings?.preferredCurrency ?? 'USD'),
    publicBoostDisplayMinimumMinor:
      overrides?.publicBoostDisplayMinimumMinor !== undefined
        ? overrides.publicBoostDisplayMinimumMinor
        : (bucket.settings?.publicBoostDisplayMinimumMinor ?? 0),
    conversionEndpointUrl: toConversionEndpointUrl(bucket.idText),
    ancestors,
  };
}

export { toConversionEndpointUrl };
