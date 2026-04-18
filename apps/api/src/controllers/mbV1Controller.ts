import type { CreateMbV1BoostBody } from '../schemas/mbV1.js';
import type { BucketMessage } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH } from '@metaboost/helpers';
import { BucketMessageService } from '@metaboost/orm';

import { config } from '../config/index.js';
import {
  isSenderGuidBlockedForTargetBucket,
  listBlockedSenderGuidsForBucket,
} from '../lib/blocked-sender-scope.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';
import { normalizeCurrencyAndAmountUnit } from '../lib/standardIngest/currency.js';
import { persistStandardBoostMessage } from '../lib/standardIngest/persistBoostMessage.js';

const MB_V1_SCHEMA = 'mb-v1';
const MB_V1_STANDARD_PREFIX = '/standard/mb-v1';

const SENDER_BLOCKED_MESSAGE = 'You have been blocked from sending messages to this recipient.';

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

const isMbBoostBucketType = (type: string): boolean =>
  type === 'mb-root' || type === 'mb-mid' || type === 'mb-leaf';

const resolveBoostBucket = async (
  bucketShortId: string
): Promise<{
  bucketId: string;
  bucketShortId: string;
  ownerId: string;
  isPublic: boolean;
  messageCharLimit: number;
} | null> => {
  const resolved = await getBucketAndEffective(bucketShortId);
  if (resolved === null || !isMbBoostBucketType(resolved.bucket.type)) {
    return null;
  }
  const messageBodyMaxLength =
    resolved.bucket.settings?.messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH;
  return {
    bucketId: resolved.bucket.id,
    bucketShortId: resolved.bucket.shortId,
    ownerId: resolved.bucket.ownerId,
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

  const senderGuidRaw =
    typeof req.query.sender_guid === 'string' ? req.query.sender_guid.trim() : '';
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let senderBlocked = false;
  if (senderGuidRaw !== '' && uuidRe.test(senderGuidRaw)) {
    senderBlocked = await isSenderGuidBlockedForTargetBucket(resolved.bucketId, senderGuidRaw);
  }

  const response: {
    schema: string;
    message_char_limit: number;
    terms_of_service_url: string;
    schema_definition_url: string;
    public_messages_url?: string;
    sender_blocked: boolean;
    sender_block_message?: string;
  } = {
    schema: MB_V1_SCHEMA,
    message_char_limit: resolved.messageCharLimit,
    terms_of_service_url: config.messagesTermsOfServiceUrl,
    schema_definition_url: `${config.apiVersionPath}${MB_V1_STANDARD_PREFIX}/openapi.json`,
    sender_blocked: senderBlocked,
  };
  if (senderBlocked) {
    response.sender_block_message = SENDER_BLOCKED_MESSAGE;
  }
  if (resolved.isPublic) {
    response.public_messages_url = `${config.apiVersionPath}${MB_V1_STANDARD_PREFIX}/messages/public/${resolved.bucketShortId}`;
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

  const body = req.body as CreateMbV1BoostBody;
  const normalizedValue = normalizeCurrencyAndAmountUnit({
    currency: body.currency,
    amount_unit: body.amount_unit,
  });

  if (typeof body.message === 'string' && body.message.length > resolved.messageCharLimit) {
    res.status(400).json({
      message: `message must be at most ${resolved.messageCharLimit} characters`,
      errors: [{ field: 'message', message: 'message exceeds message_char_limit' }],
    });
    return;
  }

  if (await isSenderGuidBlockedForTargetBucket(resolved.bucketId, body.sender_guid)) {
    res.status(403).json({
      message: SENDER_BLOCKED_MESSAGE,
      code: 'sender_blocked',
    });
    return;
  }

  const persisted = await persistStandardBoostMessage({
    targetBucketId: resolved.bucketId,
    body,
    normalizedValue,
  });
  if (persisted.streamResponse) {
    res.status(200).json({
      action: 'stream',
      message_sent: false,
    });
    return;
  }
  res.status(201).json({ message_guid: persisted.messageGuid });
}

const listPublicBucketMessagesByBucketId = async (
  bucketId: string,
  req: Request
): Promise<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  messages: BucketMessage[];
}> => {
  const { page, limit, offset } = parsePageLimit(req.query);
  const excludeSenderGuids = await listBlockedSenderGuidsForBucket(bucketId);
  const messages = await BucketMessageService.findByBucketId(bucketId, {
    limit,
    offset,
    publicOnly: true,
    actions: ['boost'],
    order: 'DESC',
    excludeSenderGuids,
  });
  const total = await BucketMessageService.countByBucketId(bucketId, {
    publicOnly: true,
    actions: ['boost'],
    excludeSenderGuids,
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    messages,
  };
};

export async function listPublicMessages(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const resolved = await resolveBoostBucket(bucketShortId);
  if (resolved === null || !resolved.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const result = await listPublicBucketMessagesByBucketId(resolved.bucketId, req);
  res.status(200).json({
    messages: result.messages,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}
