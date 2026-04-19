import type { CreateMbV1BoostBody } from '../schemas/mbV1.js';
import type { BucketMessage } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH } from '@metaboost/helpers';
import { CurrencyDenominationError } from '@metaboost/helpers-currency';
import { BucketService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { evaluateAppPostingPolicy } from '../lib/app-block-policy.js';
import { getAppRegistryService } from '../lib/appRegistry/singleton.js';
import {
  isSenderGuidBlockedForTargetBucket,
  listBlockedSenderGuidsForBucket,
} from '../lib/blocked-sender-scope.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';
import {
  hasDisallowedThresholdQueryParams,
  listFilteredBoostMessagesByBucketIds,
  parseMinimumAmountMinorFromQuery,
} from '../lib/message-threshold-filter.js';
import { parsePageLimit } from '../lib/parsePageLimit.js';
import { withSourceBucketContext } from '../lib/sourceBucketContext.js';
import { normalizeCurrencyAndAmountUnit } from '../lib/standardIngest/currency.js';
import { persistStandardBoostMessage } from '../lib/standardIngest/persistBoostMessage.js';

const MB_V1_SCHEMA = 'mb-v1';
const MB_V1_STANDARD_PREFIX = '/standard/mb-v1';

const SENDER_BLOCKED_MESSAGE = 'You have been blocked from sending messages to this recipient.';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

type PublicStandardMessage = {
  id: string;
  messageGuid: string;
  currency: string;
  amount: string;
  amountUnit: string | null;
  appName: string;
  senderName: string | null;
  body: string | null;
  createdAt: Date;
  sourceBucketContext?: BucketMessage['sourceBucketContext'];
  breadcrumbContext: null;
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
  const appIdRaw = typeof req.query.app_id === 'string' ? req.query.app_id.trim() : '';
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let senderBlocked = false;
  if (senderGuidRaw !== '' && uuidRe.test(senderGuidRaw)) {
    senderBlocked = await isSenderGuidBlockedForTargetBucket(resolved.bucketId, senderGuidRaw);
  }
  const appPolicy =
    appIdRaw !== ''
      ? await evaluateAppPostingPolicy({
          targetBucketId: resolved.bucketId,
          appIdRaw,
          registry: getAppRegistryService(),
        })
      : null;

  const response: {
    schema: string;
    message_char_limit: number;
    terms_of_service_url: string;
    schema_definition_url: string;
    public_messages_url?: string;
    sender_blocked: boolean;
    sender_block_message?: string;
    app_id_checked?: string;
    app_allowed?: boolean;
    app_block_reason?: string;
    app_block_message?: string;
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
  if (appPolicy !== null) {
    response.app_id_checked = appPolicy.appId;
    response.app_allowed = appPolicy.allowed;
    if (!appPolicy.allowed && appPolicy.reason !== undefined) {
      response.app_block_reason = appPolicy.reason;
      response.app_block_message = appPolicy.message ?? 'App is blocked.';
    }
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
  let normalizedValue: ReturnType<typeof normalizeCurrencyAndAmountUnit>;
  try {
    normalizedValue = normalizeCurrencyAndAmountUnit({
      currency: body.currency,
      amount_unit: body.amount_unit,
    });
  } catch (error) {
    if (error instanceof CurrencyDenominationError) {
      res.status(400).json({
        message: error.message,
        errors: [{ field: 'amount_unit', message: error.message }],
      });
      return;
    }
    throw error;
  }

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
  const appId = req.appAssertionAppId;
  if (appId === undefined || appId.trim() === '') {
    res.status(401).json({
      message: 'AppAssertion JWT is required for this request.',
      code: 'app_assertion_required',
    });
    return;
  }
  const appPolicy = await evaluateAppPostingPolicy({
    targetBucketId: resolved.bucketId,
    appIdRaw: appId,
    registry: getAppRegistryService(),
  });
  if (!appPolicy.allowed) {
    res.status(403).json({
      message: appPolicy.message ?? 'App is blocked.',
      code: appPolicy.reason,
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

const listPublicBucketMessagesByBucketIds = async (
  bucketIds: string[],
  req: Request
): Promise<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  messages: BucketMessage[];
}> => {
  const { page, limit, offset } = parsePageLimit(req.query, {
    defaultLimit: DEFAULT_LIMIT,
    maxLimit: MAX_LIMIT,
  });
  if (bucketIds.length === 0) {
    return {
      page,
      limit,
      total: 0,
      totalPages: 1,
      messages: [],
    };
  }
  const primaryBucketId = bucketIds[0];
  if (primaryBucketId === undefined) {
    return {
      page,
      limit,
      total: 0,
      totalPages: 1,
      messages: [],
    };
  }
  const excludeSenderGuids = await listBlockedSenderGuidsForBucket(primaryBucketId);
  const rootBucketId = await BucketService.resolveRootBucketId(primaryBucketId);
  if (rootBucketId === null) {
    return {
      page,
      limit,
      total: 0,
      totalPages: 1,
      messages: [],
    };
  }
  const result = await listFilteredBoostMessagesByBucketIds({
    bucketIds,
    rootBucketId,
    requestMinimumAmountMinor: parseMinimumAmountMinorFromQuery(req.query),
    page,
    limit,
    offset,
    order: 'DESC',
    publicOnly: true,
    excludeSenderGuids,
  });
  const messagesWithSourceContext = await withSourceBucketContext(result.messages);
  return {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
    messages: messagesWithSourceContext,
  };
};

const toPublicStandardMessages = (messages: BucketMessage[]): PublicStandardMessage[] =>
  messages.map((message) => ({
    id: message.id,
    messageGuid: message.messageGuid,
    currency: message.currency,
    amount: message.amount,
    amountUnit: message.amountUnit,
    appName: message.appName,
    senderName: message.senderName,
    body: message.body,
    createdAt: message.createdAt,
    sourceBucketContext: message.sourceBucketContext,
    breadcrumbContext: null,
  }));

export async function listPublicMessages(req: Request, res: Response): Promise<void> {
  if (hasDisallowedThresholdQueryParams(req.query)) {
    res.status(400).json({
      message: 'Unsupported threshold query parameter. Use minimumAmountMinor.',
    });
    return;
  }
  const bucketShortId = req.params.bucketShortId as string;
  const resolved = await resolveBoostBucket(bucketShortId);
  if (resolved === null || !resolved.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const bucketIds = [
    resolved.bucketId,
    ...(await BucketService.findDescendantIds(resolved.bucketId)),
  ];
  const result = await listPublicBucketMessagesByBucketIds(bucketIds, req);
  const publicMessages = toPublicStandardMessages(result.messages);
  res.status(200).json({
    messages: publicMessages,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}
