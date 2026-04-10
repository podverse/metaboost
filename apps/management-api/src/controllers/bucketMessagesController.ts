import type { CreateMessageBody, UpdateMessageBody } from '../schemas/messages.js';
import type { Request, Response } from 'express';

import { DEFAULT_PAGE_LIMIT, MAX_PAGE_SIZE } from '@metaboost/helpers';
import { BucketMessageService } from '@metaboost/orm';

import { messageToJson } from '../lib/messageToJson.js';
import { resolveBucket } from './bucketsController.js';

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

  const messages = await BucketMessageService.findByBucketId(bucket.id, {
    limit,
    offset,
    publicOnly: false,
    order,
  });
  const total = await BucketMessageService.countByBucketId(bucket.id, false);
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
  const message = await BucketMessageService.findById(messageId);
  if (message === null || message.bucketId !== bucket.id) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  res.status(200).json({ message: messageToJson(message) });
}

export async function createMessage(req: Request, res: Response): Promise<void> {
  const bucketIdParam = req.params.bucketId as string;
  const bucket = await resolveBucket(bucketIdParam);
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const body = req.body as CreateMessageBody;
  const message = await BucketMessageService.create({
    bucketId: bucket.id,
    senderName: body.senderName,
    body: body.body,
    isPublic: body.isPublic ?? false,
  });
  res.status(201).json({ message: messageToJson(message) });
}

export async function updateMessage(req: Request, res: Response): Promise<void> {
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
  const body = req.body as UpdateMessageBody;
  await BucketMessageService.update(messageId, {
    body: body.body,
    isPublic: body.isPublic,
  });
  const updated = await BucketMessageService.findById(messageId);
  if (updated === null) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  res.status(200).json({ message: messageToJson(updated) });
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
