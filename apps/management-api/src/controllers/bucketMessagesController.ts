import type { BucketType } from '@metaboost/helpers-requests';
import type { Request, Response } from 'express';

import {
  coerceFirstQueryString,
  DEFAULT_PAGE_LIMIT,
  isTruthyQueryFlag,
  MAX_PAGE_SIZE,
} from '@metaboost/helpers';
import { BucketBlockedSenderService, BucketMessageService, BucketService } from '@metaboost/orm';

import { messageToJson } from '../lib/messageToJson.js';
import { resolveBucket } from './bucketsController.js';

async function getMessageBucketIdsForScope(bucket: {
  id: string;
  type: BucketType;
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

function parseMinimumAmountUsdCents(query: Request['query']): number | undefined {
  const raw = coerceFirstQueryString(query.minimumAmountUsdCents);
  if (raw === undefined || raw === '') {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  const bucketIdParam = req.params.bucketId as string;
  const bucket = await resolveBucket(bucketIdParam);
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const offset = (page - 1) * limit;
  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const order = sortRaw === 'oldest' ? 'ASC' : 'DESC';
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const rootId = await BucketService.resolveRootBucketId(bucket.id);
  const rootBucket = rootId === null ? null : await BucketService.findById(rootId);
  const rootMinimumUsdCents = rootBucket?.settings?.minimumMessageUsdCents ?? 0;
  const requestMinimumUsdCents = parseMinimumAmountUsdCents(req.query);
  const effectiveMinimumUsdCents = Math.max(rootMinimumUsdCents, requestMinimumUsdCents ?? 0);
  const includeBlocked = isTruthyQueryFlag(req.query.includeBlockedSenderMessages);
  const excludeSenderGuids = includeBlocked
    ? undefined
    : rootId === null
      ? []
      : await BucketBlockedSenderService.listGuidsByRootBucketId(rootId);

  const messages = await BucketMessageService.findByBucketIds(messageBucketIds, {
    limit,
    offset,
    publicOnly: false,
    actions: ['boost'],
    order,
    excludeSenderGuids,
    minimumUsdCents: effectiveMinimumUsdCents,
  });
  const total = await BucketMessageService.countByBucketIds(messageBucketIds, {
    publicOnly: false,
    actions: ['boost'],
    excludeSenderGuids,
    minimumUsdCents: effectiveMinimumUsdCents,
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.status(200).json({
    messages: messages.map(messageToJson),
    page,
    limit,
    total,
    totalPages,
  });
}

export async function getMessage(req: Request, res: Response): Promise<void> {
  const bucketIdParam = req.params.bucketId as string;
  const messageId = req.params.messageId as string;
  const bucket = await resolveBucket(bucketIdParam);
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const message = await BucketMessageService.findById(messageId, { actions: ['boost'] });
  if (message === null || !messageBucketIds.includes(message.bucketId)) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  res.status(200).json({ message: messageToJson(message) });
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  const bucketIdParam = req.params.bucketId as string;
  const messageId = req.params.messageId as string;
  const bucket = await resolveBucket(bucketIdParam);
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const message = await BucketMessageService.findById(messageId);
  if (message === null || !messageBucketIds.includes(message.bucketId)) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  await BucketMessageService.delete(messageId);
  res.status(204).send();
}
