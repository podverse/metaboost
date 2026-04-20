import type { BucketType } from '@metaboost/helpers-requests';
import type { BucketMessage } from '@metaboost/orm';

import { BucketService } from '@metaboost/orm';

type SourceBucketSummary = {
  id: string;
  shortId: string;
  name: string;
  type: BucketType;
  parentBucketId: string | null;
};

type SourceBucketContextSummary = Omit<SourceBucketSummary, 'parentBucketId'>;

type SourceBucketContext = {
  bucket: SourceBucketContextSummary;
  parentBucket: SourceBucketContextSummary | null;
};

function toSourceContextSummary(bucket: SourceBucketSummary): SourceBucketContextSummary {
  return {
    id: bucket.id,
    shortId: bucket.shortId,
    name: bucket.name,
    type: bucket.type,
  };
}

export async function withSourceBucketContext(messages: BucketMessage[]): Promise<BucketMessage[]> {
  if (messages.length === 0) {
    return messages;
  }

  const sourceBucketIds = [...new Set(messages.map((message) => message.bucketId))];
  const sourceBuckets = await BucketService.findByIds(sourceBucketIds);
  const sourceBucketsById = new Map<string, SourceBucketSummary>(
    sourceBuckets.map((bucket) => [
      bucket.id,
      {
        id: bucket.id,
        shortId: bucket.shortId,
        name: bucket.name,
        type: bucket.type,
        parentBucketId: bucket.parentBucketId,
      },
    ])
  );

  const parentBucketIds = [
    ...new Set(
      sourceBuckets
        .map((bucket) => bucket.parentBucketId)
        .filter((parentBucketId): parentBucketId is string => parentBucketId !== null)
    ),
  ];
  const parentBuckets = await BucketService.findByIds(parentBucketIds);
  const parentBucketsById = new Map<string, SourceBucketSummary>(
    parentBuckets.map((bucket) => [
      bucket.id,
      {
        id: bucket.id,
        shortId: bucket.shortId,
        name: bucket.name,
        type: bucket.type,
        parentBucketId: bucket.parentBucketId,
      },
    ])
  );

  return messages.map((message) => {
    const sourceBucket = sourceBucketsById.get(message.bucketId);
    if (sourceBucket === undefined) {
      return message;
    }

    const parentBucket =
      sourceBucket.parentBucketId !== null
        ? (parentBucketsById.get(sourceBucket.parentBucketId) ?? null)
        : null;

    const sourceBucketContext: SourceBucketContext = {
      bucket: toSourceContextSummary(sourceBucket),
      parentBucket: parentBucket !== null ? toSourceContextSummary(parentBucket) : null,
    };

    return { ...message, sourceBucketContext };
  });
}
