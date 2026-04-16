import type { BucketMessage } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { DEFAULT_PAGE_LIMIT, MAX_PAGE_SIZE } from '@metaboost/helpers';
import { BucketMessageService, BucketService } from '@metaboost/orm';

import { getBucketContext } from '../lib/bucket-context.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';
import { canReadBucket, canReadMessage, canDeleteMessage } from '../lib/bucket-policy.js';
import { toPublicBucketResponse } from '../lib/bucket-response.js';

type SourceBucketSummary = {
  id: string;
  shortId: string;
  name: string;
  type: 'rss-network' | 'rss-channel' | 'rss-item';
  parentBucketId: string | null;
};

type SourceBucketContextSummary = Omit<SourceBucketSummary, 'parentBucketId'>;

type SourceBucketContext = {
  bucket: SourceBucketContextSummary;
  parentBucket: SourceBucketContextSummary | null;
};

async function getMessageBucketIdsForScope(bucket: {
  id: string;
  type: 'rss-network' | 'rss-channel' | 'rss-item';
}): Promise<string[]> {
  if (bucket.type === 'rss-network') {
    return BucketService.findDescendantIds(bucket.id);
  }
  if (bucket.type === 'rss-channel') {
    const descendantIds = await BucketService.findDescendantIds(bucket.id);
    return [bucket.id, ...descendantIds];
  }
  return [bucket.id];
}

function toSourceContextSummary(bucket: SourceBucketSummary): SourceBucketContextSummary {
  return {
    id: bucket.id,
    shortId: bucket.shortId,
    name: bucket.name,
    type: bucket.type,
  };
}

async function withSourceBucketContext(messages: BucketMessage[]): Promise<BucketMessage[]> {
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

export async function listMessages(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canReadBucket });
  if (ctx === null) return;
  const { bucket } = ctx.resolved;
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const offset = (page - 1) * limit;
  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const order = sortRaw === 'oldest' ? 'ASC' : 'DESC';
  const messages = await BucketMessageService.findByBucketIds(messageBucketIds, {
    limit,
    offset,
    publicOnly: false,
    actions: ['boost'],
    order,
  });
  const messagesWithContext = await withSourceBucketContext(messages);
  const total = await BucketMessageService.countByBucketIds(messageBucketIds, {
    publicOnly: false,
    actions: ['boost'],
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.status(200).json({
    messages: messagesWithContext,
    page,
    limit,
    total,
    totalPages,
  });
}

export async function getMessage(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canReadBucket });
  if (ctx === null) return;
  const messageId = req.params.id as string;
  const { bucket, effectiveBucket } = ctx.resolved;
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const message = await BucketMessageService.findById(messageId, { actions: ['boost'] });
  if (message === null || !messageBucketIds.includes(message.bucketId)) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  const messageBucket = await BucketService.findById(message.bucketId);
  if (messageBucket === null) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  if (!canReadMessage(ctx.user.id, effectiveBucket, ctx.bucketAdmin, messageBucket.isPublic)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  const [messageWithContext] = await withSourceBucketContext([message]);
  res.status(200).json({ message: messageWithContext ?? message });
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canDeleteMessage });
  if (ctx === null) return;
  const messageId = req.params.id as string;
  const { bucket, effectiveBucket } = ctx.resolved;
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const message = await BucketMessageService.findById(messageId);
  if (message === null || !messageBucketIds.includes(message.bucketId)) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  if (!canDeleteMessage(ctx.user.id, effectiveBucket, ctx.bucketAdmin, message)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  await BucketMessageService.delete(messageId);
  res.status(204).send();
}

/** Public: get bucket metadata by short_id (only if bucket is public). */
export async function getPublicBucket(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const resolved = await getBucketAndEffective(id);
  if (resolved === null || !resolved.bucket.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const { bucket } = resolved;
  const ancestry = await BucketService.findAncestry(bucket.id);
  const ancestors = ancestry
    .filter((b) => b.isPublic)
    .map((b) => ({ shortId: b.shortId, name: b.name }));
  res.status(200).json({ bucket: toPublicBucketResponse(bucket, undefined, ancestors) });
}

/** Public: list public messages in a bucket by short_id (only if bucket is public). */
export async function listPublicMessages(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const resolved = await getBucketAndEffective(id);
  if (resolved === null || !resolved.bucket.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const { bucket } = resolved;
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const offset = (page - 1) * limit;
  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const order = sortRaw === 'oldest' ? 'ASC' : 'DESC';
  const messages = await BucketMessageService.findByBucketIds(messageBucketIds, {
    limit,
    offset,
    publicOnly: true,
    actions: ['boost'],
    order,
  });
  const messagesWithContext = await withSourceBucketContext(messages);
  const total = await BucketMessageService.countByBucketIds(messageBucketIds, {
    publicOnly: true,
    actions: ['boost'],
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.status(200).json({
    messages: messagesWithContext,
    page,
    limit,
    total,
    totalPages,
  });
}
