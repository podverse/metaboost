import type { CreateMb1BoostBody, ConfirmMb1PaymentBody } from '../schemas/mb1.js';
import type { BucketMessage } from '@metaboost/orm';
import type {
  BucketMessageRecipientOutcome,
  Mb1PaymentRecipientStatus,
  Mb1PaymentVerificationLevel,
} from '@metaboost/orm';
import type { Request, Response } from 'express';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH } from '@metaboost/helpers';
import {
  BucketMessageService,
  BucketRSSChannelInfoService,
  BucketRSSItemInfoService,
  BucketService,
} from '@metaboost/orm';
import { MinimalRssParserError } from '@metaboost/rss-parser';

import { config } from '../config/index.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';
import { verifyAndSyncRssChannelBucket } from '../lib/rss-sync.js';

const MB1_SCHEMA = 'mb1';
const MB1_STANDARD_PREFIX = '/s/mb1';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const DEFAULT_VERIFICATION_THRESHOLD: Mb1PaymentVerificationLevel =
  'verified-largest-recipient-succeeded';

const parseBooleanQuery = (value: unknown): boolean =>
  value === '1' || value === 'true' || value === true;

const toVerificationThreshold = (input: {
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

const toRecipientOutcome = (
  input: ConfirmMb1PaymentBody['recipient_outcomes'][number]
): BucketMessageRecipientOutcome => {
  return {
    type: input.type,
    address: input.address,
    split: input.split,
    name: input.name ?? null,
    custom_key: input.custom_key ?? null,
    custom_value: input.custom_value ?? null,
    fee: input.fee,
    status: input.status,
  };
};

const derivePaymentVerification = (
  recipientOutcomes: BucketMessageRecipientOutcome[]
): {
  paymentVerificationLevel: Mb1PaymentVerificationLevel;
  paymentVerifiedByApp: boolean;
  paymentRecipientVerifiedCount: number;
  paymentRecipientFailedCount: number;
  paymentRecipientUndeterminedCount: number;
  largestRecipientStatus: Mb1PaymentRecipientStatus;
} => {
  const paymentRecipientVerifiedCount = recipientOutcomes.filter(
    (recipient) => recipient.status === 'verified'
  ).length;
  const paymentRecipientFailedCount = recipientOutcomes.filter(
    (recipient) => recipient.status === 'failed'
  ).length;
  const paymentRecipientUndeterminedCount = recipientOutcomes.filter(
    (recipient) => recipient.status === 'undetermined'
  ).length;

  const largestRecipient = recipientOutcomes.reduce<BucketMessageRecipientOutcome | null>(
    (currentLargest, recipient) => {
      if (currentLargest === null) {
        return recipient;
      }
      if (recipient.split > currentLargest.split) {
        return recipient;
      }
      return currentLargest;
    },
    null
  );

  const largestRecipientStatus = largestRecipient?.status ?? 'undetermined';
  const allRecipientsVerified =
    recipientOutcomes.length > 0 && paymentRecipientVerifiedCount === recipientOutcomes.length;
  const hasAnyVerifiedRecipient = paymentRecipientVerifiedCount > 0;

  const paymentVerificationLevel: Mb1PaymentVerificationLevel = allRecipientsVerified
    ? 'fully-verified'
    : largestRecipientStatus === 'verified'
      ? 'verified-largest-recipient-succeeded'
      : hasAnyVerifiedRecipient
        ? 'partially-verified'
        : 'not-verified';

  return {
    paymentVerificationLevel,
    paymentVerifiedByApp:
      paymentVerificationLevel === 'fully-verified' ||
      paymentVerificationLevel === 'verified-largest-recipient-succeeded',
    paymentRecipientVerifiedCount,
    paymentRecipientFailedCount,
    paymentRecipientUndeterminedCount,
    largestRecipientStatus,
  };
};

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
  ownerId: string;
  isPublic: boolean;
  messageCharLimit: number;
} | null> => {
  const resolved = await getBucketAndEffective(bucketShortId);
  if (resolved === null || resolved.bucket.type !== 'rss-channel') {
    return null;
  }
  const messageBodyMaxLength =
    resolved.effectiveSettings?.messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH;
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

  const channelInfo = await BucketRSSChannelInfoService.findByBucketId(resolved.bucketId);
  if (channelInfo === null) {
    res.status(400).json({
      message: 'RSS channel metadata not configured for this bucket',
      errors: [{ field: 'feed_guid', message: 'bucket has no rss channel guid metadata' }],
    });
    return;
  }

  if (body.feed_guid !== channelInfo.rssPodcastGuid) {
    res.status(400).json({
      message: 'feed_guid must match the bucket feed guid for this endpoint',
      errors: [{ field: 'feed_guid', message: 'feed_guid does not match expected value' }],
    });
    return;
  }

  if (typeof body.message === 'string' && body.message.length > resolved.messageCharLimit) {
    res.status(400).json({
      message: `message must be at most ${resolved.messageCharLimit} characters`,
      errors: [{ field: 'message', message: 'message exceeds message_char_limit' }],
    });
    return;
  }

  let targetBucketId = resolved.bucketId;
  if (body.item_guid !== undefined && body.item_guid.trim() !== '') {
    const requestedItemGuid = body.item_guid.trim();
    let itemInfo = await BucketRSSItemInfoService.findByParentChannelBucketIdAndItemGuid(
      resolved.bucketId,
      requestedItemGuid
    );

    if (itemInfo === null) {
      const parseIsStale =
        channelInfo.rssLastParseAttempt === null ||
        Date.now() - channelInfo.rssLastParseAttempt.getTime() >= config.rssParseMinIntervalMs;
      if (parseIsStale) {
        try {
          await verifyAndSyncRssChannelBucket({
            bucket: {
              id: resolved.bucketId,
              shortId: resolved.bucketShortId,
              ownerId: resolved.ownerId,
              isPublic: resolved.isPublic,
            },
            channelInfo,
          });
        } catch (error) {
          if (error instanceof MinimalRssParserError) {
            res.status(400).json({
              message: 'Unable to refresh RSS feed while resolving item_guid',
              errors: [{ field: 'item_guid', message: `rss refresh failed: ${error.message}` }],
            });
            return;
          }
          throw error;
        }

        itemInfo = await BucketRSSItemInfoService.findByParentChannelBucketIdAndItemGuid(
          resolved.bucketId,
          requestedItemGuid
        );
      }
    }

    if (itemInfo === null) {
      res.status(404).json({
        message: 'RSS item bucket not found for item_guid',
        errors: [
          {
            field: 'item_guid',
            message: 'no rss item bucket matches item_guid after latest parse check',
          },
        ],
      });
      return;
    }
    targetBucketId = itemInfo.bucketId;
  }

  if (body.action === 'stream') {
    await BucketMessageService.create({
      bucketId: targetBucketId,
      senderName: body.sender_name ?? body.app_name,
      body: null,
      currency: body.currency,
      amount: body.amount,
      amountUnit: body.amount_unit ?? null,
      action: body.action,
      appName: body.app_name,
      appVersion: body.app_version ?? null,
      senderId: body.sender_id ?? null,
      podcastIndexFeedId: body.podcast_index_feed_id ?? null,
      timePosition: body.time_position ?? null,
      paymentVerifiedByApp: false,
      paymentVerificationLevel: 'not-verified',
      paymentRecipientOutcomes: [],
      paymentRecipientVerifiedCount: 0,
      paymentRecipientFailedCount: 0,
      paymentRecipientUndeterminedCount: 0,
      isPublic: true,
    });
    res.status(200).json({
      action: 'stream',
      message_sent: false,
    });
    return;
  }

  const storedMessage = await BucketMessageService.create({
    bucketId: targetBucketId,
    senderName: body.sender_name ?? body.app_name,
    body: body.message ?? null,
    currency: body.currency,
    amount: body.amount,
    amountUnit: body.amount_unit ?? null,
    action: body.action,
    appName: body.app_name,
    appVersion: body.app_version ?? null,
    senderId: body.sender_id ?? null,
    podcastIndexFeedId: body.podcast_index_feed_id ?? null,
    timePosition: body.time_position ?? null,
    paymentVerifiedByApp: false,
    paymentVerificationLevel: 'not-verified',
    paymentRecipientOutcomes: [],
    paymentRecipientVerifiedCount: 0,
    paymentRecipientFailedCount: 0,
    paymentRecipientUndeterminedCount: 0,
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
  if (message === null) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }

  let messageInChannelContext = message.bucketId === resolved.bucketId;
  if (!messageInChannelContext) {
    const messageBucket = await BucketService.findById(message.bucketId);
    messageInChannelContext =
      messageBucket !== null &&
      messageBucket.type === 'rss-item' &&
      messageBucket.parentBucketId === resolved.bucketId;
  }
  if (!messageInChannelContext) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }

  const recipientOutcomes = body.recipient_outcomes.map(toRecipientOutcome);
  const derivedVerification = derivePaymentVerification(recipientOutcomes);

  await BucketMessageService.update(message.id, {
    paymentVerifiedByApp: derivedVerification.paymentVerifiedByApp,
    paymentVerificationLevel: derivedVerification.paymentVerificationLevel,
    paymentRecipientOutcomes: recipientOutcomes,
    paymentRecipientVerifiedCount: derivedVerification.paymentRecipientVerifiedCount,
    paymentRecipientFailedCount: derivedVerification.paymentRecipientFailedCount,
    paymentRecipientUndeterminedCount: derivedVerification.paymentRecipientUndeterminedCount,
    largestRecipientStatus: derivedVerification.largestRecipientStatus,
  });
  res.status(200).json({
    message_guid: message.id,
    payment_verified_by_app: derivedVerification.paymentVerifiedByApp,
    payment_verification_level: derivedVerification.paymentVerificationLevel,
    payment_recipient_summary: {
      total: recipientOutcomes.length,
      verified: derivedVerification.paymentRecipientVerifiedCount,
      failed: derivedVerification.paymentRecipientFailedCount,
      undetermined: derivedVerification.paymentRecipientUndeterminedCount,
      largest_recipient_status: derivedVerification.largestRecipientStatus,
    },
    recipient_outcomes: recipientOutcomes,
  });
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
  const includePartiallyVerified = parseBooleanQuery(req.query.includePartiallyVerified);
  const includeUnverified = parseBooleanQuery(req.query.includeUnverified);
  const verificationThreshold = toVerificationThreshold({
    includePartiallyVerified,
    includeUnverified,
  });
  const messages = await BucketMessageService.findByBucketId(bucketId, {
    limit,
    offset,
    publicOnly: true,
    verificationThreshold,
    actions: ['boost'],
    order: 'DESC',
  });
  const total = await BucketMessageService.countByBucketId(bucketId, {
    publicOnly: true,
    verificationThreshold,
    actions: ['boost'],
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

export async function listPublicMessagesForChannel(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const podcastGuid = req.params.podcastGuid as string;
  if (podcastGuid.trim() === '') {
    res.status(400).json({ message: 'podcastGuid is required' });
    return;
  }
  const resolved = await resolveBoostBucket(bucketShortId);
  if (resolved === null || !resolved.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const channelInfo = await BucketRSSChannelInfoService.findByBucketId(resolved.bucketId);
  if (channelInfo === null || channelInfo.rssPodcastGuid !== podcastGuid) {
    res.status(404).json({ message: 'Channel not found for bucket' });
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

export async function listPublicMessagesForItem(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const itemGuid = req.params.itemGuid as string;
  if (itemGuid.trim() === '') {
    res.status(400).json({ message: 'itemGuid is required' });
    return;
  }
  const resolved = await resolveBoostBucket(bucketShortId);
  if (resolved === null || !resolved.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const itemInfo = await BucketRSSItemInfoService.findByParentChannelBucketIdAndItemGuid(
    resolved.bucketId,
    itemGuid
  );
  if (itemInfo === null) {
    res.status(404).json({ message: 'RSS item bucket not found for itemGuid' });
    return;
  }
  const result = await listPublicBucketMessagesByBucketId(itemInfo.bucketId, req);
  res.status(200).json({
    messages: result.messages,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}
