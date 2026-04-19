import type { BucketType } from '@metaboost/helpers-requests';
import type { Request, Response } from 'express';

import {
  DEFAULT_PAGE_LIMIT,
  isTruthyQueryFlag,
  MAX_PAGE_SIZE,
  parseNonNegativeIntegerQueryParam,
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

function parseMinimumAmountMinor(query: Request['query']): number | undefined {
  return parseNonNegativeIntegerQueryParam(query.minimumAmountMinor);
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  if (req.query.minimumAmountUsdCents !== undefined) {
    res.status(400).json({
      message: 'Unsupported threshold query parameter. Use minimumAmountMinor.',
    });
    return;
  }
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
  const rootPreferredCurrency =
    rootBucket?.settings?.preferredCurrency ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
  const rootMinimumAmountMinor = rootBucket?.settings?.minimumMessageAmountMinor ?? 0;
  const requestMinimumAmountMinor = parseMinimumAmountMinor(req.query);
  const effectiveMinimumAmountMinor = Math.max(
    rootMinimumAmountMinor,
    requestMinimumAmountMinor ?? 0
  );
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
    minimumThresholdAmountMinor: effectiveMinimumAmountMinor,
    thresholdCurrency: rootPreferredCurrency,
  });
  const total = await BucketMessageService.countByBucketIds(messageBucketIds, {
    publicOnly: false,
    actions: ['boost'],
    excludeSenderGuids,
    minimumThresholdAmountMinor: effectiveMinimumAmountMinor,
    thresholdCurrency: rootPreferredCurrency,
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
  if (req.query.minimumAmountUsdCents !== undefined) {
    res.status(400).json({
      message: 'Unsupported threshold query parameter. Use minimumAmountMinor.',
    });
    return;
  }
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
  const rootId = await BucketService.resolveRootBucketId(bucket.id);
  const rootBucket = rootId === null ? null : await BucketService.findById(rootId);
  const rootPreferredCurrency =
    rootBucket?.settings?.preferredCurrency ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
  const rootMinimumAmountMinor = rootBucket?.settings?.minimumMessageAmountMinor ?? 0;
  const requestMinimumAmountMinor = parseMinimumAmountMinor(req.query);
  const effectiveMinimumAmountMinor = Math.max(
    rootMinimumAmountMinor,
    requestMinimumAmountMinor ?? 0
  );
  if (
    effectiveMinimumAmountMinor > 0 &&
    (message.thresholdAmountMinorAtCreate === null ||
      message.thresholdCurrencyAtCreate !== rootPreferredCurrency ||
      message.thresholdAmountMinorAtCreate < effectiveMinimumAmountMinor)
  ) {
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
