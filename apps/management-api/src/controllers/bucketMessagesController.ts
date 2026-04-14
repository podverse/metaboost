import type { Mb1PaymentVerificationLevel } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { DEFAULT_PAGE_LIMIT, MAX_PAGE_SIZE } from '@metaboost/helpers';
import { BucketMessageService } from '@metaboost/orm';

import { messageToJson } from '../lib/messageToJson.js';
import { resolveBucket } from './bucketsController.js';

const DEFAULT_VERIFICATION_THRESHOLD: Mb1PaymentVerificationLevel =
  'verified-largest-recipient-succeeded';

const parseBooleanQuery = (value: unknown): boolean =>
  value === '1' || value === 'true' || value === true;

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
  const includePartiallyVerified = parseBooleanQuery(req.query.includePartiallyVerified);
  const includeUnverified = parseBooleanQuery(req.query.includeUnverified);
  const verificationThreshold: Mb1PaymentVerificationLevel = includeUnverified
    ? 'not-verified'
    : includePartiallyVerified
      ? 'partially-verified'
      : DEFAULT_VERIFICATION_THRESHOLD;

  const messages = await BucketMessageService.findByBucketId(bucket.id, {
    limit,
    offset,
    publicOnly: false,
    verificationThreshold,
    actions: ['boost'],
    order,
  });
  const total = await BucketMessageService.countByBucketId(bucket.id, {
    publicOnly: false,
    verificationThreshold,
    actions: ['boost'],
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
  const message = await BucketMessageService.findById(messageId, { actions: ['boost'] });
  if (message === null || message.bucketId !== bucket.id) {
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
  const message = await BucketMessageService.findById(messageId);
  if (message === null || message.bucketId !== bucket.id) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  await BucketMessageService.delete(messageId);
  res.status(204).send();
}
