import type { CreateMb1BoostBody, ConfirmMb1PaymentBody } from '../schemas/mb1.js';
import type { BucketMessage } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH } from '@metaboost/helpers';
import { BucketMessageService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';

const MB1_SCHEMA = 'mb1';
const MB1_STANDARD_PREFIX = '/s/mb1';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const parsePageLimit = (
  query: Request['query']
): {
  page: number;
  limit: number;
  offset: number;
} => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
  return { page, limit, offset: (page - 1) * limit };
};

const resolveBoostBucket = async (
  bucketShortId: string
): Promise<{
  bucketId: string;
  bucketShortId: string;
  isPublic: boolean;
  messageCharLimit: number;
} | null> => {
  const resolved = await getBucketAndEffective(bucketShortId);
  if (resolved === null) {
    return null;
  }
  const messageBodyMaxLength =
    resolved.effectiveSettings?.messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH;
  return {
    bucketId: resolved.bucket.id,
    bucketShortId: resolved.bucket.shortId,
    isPublic: resolved.bucket.isPublic,
    messageCharLimit: messageBodyMaxLength,
  };
};

export async function getBoostCapability(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const resolved = await resolveBoostBucket(bucketShortId);
  if (resolved === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }

  const response: {
    schema: string;
    message_char_limit: number;
    terms_of_service_url: string;
    schema_definition_url: string;
    public_messages_url?: string;
  } = {
    schema: MB1_SCHEMA,
    message_char_limit: resolved.messageCharLimit,
    terms_of_service_url: config.messagesTermsOfServiceUrl,
    schema_definition_url: `${config.apiVersionPath}${MB1_STANDARD_PREFIX}/openapi.json`,
  };
  if (resolved.isPublic) {
    response.public_messages_url = `${config.apiVersionPath}${MB1_STANDARD_PREFIX}/messages/public/${resolved.bucketShortId}`;
  }
  res.status(200).json(response);
}

export async function createBoostMessage(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const resolved = await resolveBoostBucket(bucketShortId);
  if (resolved === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }

  const body = req.body as CreateMb1BoostBody;

  // Contract phase: use bucket shortId as the expected feed guid until RSS guid storage is introduced.
  if (body.feed_guid !== resolved.bucketShortId) {
    res.status(400).json({
      message: 'feed_guid must match the bucket feed guid for this endpoint',
      errors: [{ field: 'feed_guid', message: 'feed_guid does not match expected value' }],
    });
    return;
  }

  if (body.message !== undefined && body.message.length > resolved.messageCharLimit) {
    res.status(400).json({
      message: `message must be at most ${resolved.messageCharLimit} characters`,
      errors: [{ field: 'message', message: 'message exceeds message_char_limit' }],
    });
    return;
  }

  const storedMessage = await BucketMessageService.create({
    bucketId: resolved.bucketId,
    senderName: body.sender_name ?? body.app_name,
    body: body.message ?? '',
    isPublic: true,
  });

  res.status(201).json({ message_guid: storedMessage.id });
}

export async function confirmBoostPayment(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const resolved = await resolveBoostBucket(bucketShortId);
  if (resolved === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }

  const body = req.body as ConfirmMb1PaymentBody;
  const message = await BucketMessageService.findById(body.message_guid);
  if (message === null || message.bucketId !== resolved.bucketId) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }

  // payment_verified_by_app persistence is introduced in a later phase with schema support.
  res.status(200).json({
    message_guid: message.id,
    payment_verified_by_app: body.payment_verified_by_app,
  });
}

const listPublicBucketMessages = async (
  bucketShortId: string,
  req: Request
): Promise<{
  bucketId: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  messages: BucketMessage[];
} | null> => {
  const resolved = await resolveBoostBucket(bucketShortId);
  if (resolved === null || !resolved.isPublic) {
    return null;
  }
  const { page, limit, offset } = parsePageLimit(req.query);
  const messages = await BucketMessageService.findByBucketId(resolved.bucketId, {
    limit,
    offset,
    publicOnly: true,
    order: 'DESC',
  });
  const total = await BucketMessageService.countByBucketId(resolved.bucketId, true);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    bucketId: resolved.bucketId,
    page,
    limit,
    total,
    totalPages,
    messages,
  };
};

export async function listPublicMessages(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const result = await listPublicBucketMessages(bucketShortId, req);
  if (result === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  res.status(200).json({
    messages: result.messages,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}

export async function listPublicMessagesForChannel(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const podcastGuid = req.params.podcastGuid as string;
  if (podcastGuid.trim() === '') {
    res.status(400).json({ message: 'podcastGuid is required' });
    return;
  }
  const result = await listPublicBucketMessages(bucketShortId, req);
  if (result === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  res.status(200).json({
    messages: result.messages,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}

export async function listPublicMessagesForItem(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const itemGuid = req.params.itemGuid as string;
  if (itemGuid.trim() === '') {
    res.status(400).json({ message: 'itemGuid is required' });
    return;
  }
  const result = await listPublicBucketMessages(bucketShortId, req);
  if (result === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  res.status(200).json({
    messages: result.messages,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}
