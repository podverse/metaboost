import type { Mb1PaymentVerificationLevel } from '@metaboost/orm';
import type { Request, Response } from 'express';

import {
  DEFAULT_MESSAGE_BODY_MAX_LENGTH,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_SIZE,
} from '@metaboost/helpers';
import { BucketMessageService, BucketService } from '@metaboost/orm';

import { getBucketContext } from '../lib/bucket-context.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';
import { canReadBucket, canReadMessage, canDeleteMessage } from '../lib/bucket-policy.js';
import { toPublicBucketResponse } from '../lib/bucket-response.js';

const DEFAULT_VERIFICATION_THRESHOLD: Mb1PaymentVerificationLevel =
  'verified-largest-recipient-succeeded';

const parseBooleanQuery = (value: unknown): boolean =>
  value === '1' || value === 'true' || value === true;

const getVerificationThreshold = (input: {
  includePartiallyVerified: boolean;
  includeUnverified: boolean;
}): Mb1PaymentVerificationLevel => {
  if (input.includeUnverified) {
    return 'not-verified';
  }
  if (input.includePartiallyVerified) {
    return 'partially-verified';
  }
  return DEFAULT_VERIFICATION_THRESHOLD;
};

export async function listMessages(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canReadBucket });
  if (ctx === null) return;
  const { bucket } = ctx.resolved;
  const messageBucketIds =
    bucket.type === 'rss-network' ? await BucketService.findDescendantIds(bucket.id) : [bucket.id];
  const viewerIsOwnerOrAdmin = bucket.ownerId === ctx.user.id || ctx.bucketAdmin !== null;
  const includePartiallyVerified =
    viewerIsOwnerOrAdmin && parseBooleanQuery(req.query.includePartiallyVerified);
  const includeUnverified = viewerIsOwnerOrAdmin && parseBooleanQuery(req.query.includeUnverified);
  const verificationThreshold = getVerificationThreshold({
    includePartiallyVerified,
    includeUnverified,
  });
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const offset = (page - 1) * limit;
  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const order = sortRaw === 'oldest' ? 'ASC' : 'DESC';
  const messages = await BucketMessageService.findByBucketIds(messageBucketIds, {
    limit,
    offset,
    publicOnly: false,
    verificationThreshold,
    actions: ['boost'],
    order,
  });
  const total = await BucketMessageService.countByBucketIds(messageBucketIds, {
    publicOnly: false,
    verificationThreshold,
    actions: ['boost'],
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.status(200).json({
    messages,
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
  const messageBucketIds =
    bucket.type === 'rss-network' ? await BucketService.findDescendantIds(bucket.id) : [bucket.id];
  const message = await BucketMessageService.findById(messageId, { actions: ['boost'] });
  if (message === null || !messageBucketIds.includes(message.bucketId)) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  if (!canReadMessage(ctx.user.id, effectiveBucket, ctx.bucketAdmin, message)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  res.status(200).json({ message });
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canDeleteMessage });
  if (ctx === null) return;
  const messageId = req.params.id as string;
  const { bucket, effectiveBucket } = ctx.resolved;
  const messageBucketIds =
    bucket.type === 'rss-network' ? await BucketService.findDescendantIds(bucket.id) : [bucket.id];
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
  const { bucket, effectiveSettings } = resolved;
  const overrides =
    bucket.parentBucketId !== null
      ? {
          messageBodyMaxLength:
            effectiveSettings?.messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH,
        }
      : undefined;
  const ancestry = await BucketService.findAncestry(bucket.id);
  const ancestors = ancestry
    .filter((b) => b.isPublic)
    .map((b) => ({ shortId: b.shortId, name: b.name }));
  res.status(200).json({ bucket: toPublicBucketResponse(bucket, overrides, ancestors) });
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
  const messageBucketIds =
    bucket.type === 'rss-network' ? await BucketService.findDescendantIds(bucket.id) : [bucket.id];
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const offset = (page - 1) * limit;
  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const order = sortRaw === 'oldest' ? 'ASC' : 'DESC';
  const messages = await BucketMessageService.findByBucketIds(messageBucketIds, {
    limit,
    offset,
    publicOnly: true,
    verificationThreshold: DEFAULT_VERIFICATION_THRESHOLD,
    actions: ['boost'],
    order,
  });
  const total = await BucketMessageService.countByBucketIds(messageBucketIds, {
    publicOnly: true,
    verificationThreshold: DEFAULT_VERIFICATION_THRESHOLD,
    actions: ['boost'],
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.status(200).json({
    messages,
    page,
    limit,
    total,
    totalPages,
  });
}
