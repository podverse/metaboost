import type { CreateMbrssV1BoostBody } from '../schemas/mbrssV1.js';
import type { BucketMessage } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH } from '@metaboost/helpers';
import {
  BucketMessageService,
  BucketService,
  BucketRSSChannelInfoService,
  BucketRSSItemInfoService,
} from '@metaboost/orm';
import { MinimalRssParserError } from '@metaboost/rss-parser';

import { config } from '../config/index.js';
import {
  isSenderGuidBlockedForTargetBucket,
  listBlockedSenderGuidsForBucket,
} from '../lib/blocked-sender-scope.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';
import { verifyAndSyncRssChannelBucket } from '../lib/rss-sync.js';
import { withSourceBucketContext } from '../lib/sourceBucketContext.js';
import { normalizeCurrencyAndAmountUnit } from '../lib/standardIngest/currency.js';
import { persistStandardBoostMessage } from '../lib/standardIngest/persistBoostMessage.js';

const MBRSS_V1_SCHEMA = 'mbrss-v1';
const MBRSS_V1_STANDARD_PREFIX = '/standard/mbrss-v1';

const SENDER_BLOCKED_MESSAGE = 'You have been blocked from sending messages to this recipient.';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

type PublicBreadcrumbContext = {
  level: 'channel' | 'item';
  podcastGuid: string | null;
  podcastLabel: string | null;
  itemGuid: string | null;
  itemLabel: string | null;
  isSubBucket: boolean;
};

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
  breadcrumbContext: PublicBreadcrumbContext | null;
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
    schema: MBRSS_V1_SCHEMA,
    message_char_limit: resolved.messageCharLimit,
    terms_of_service_url: config.messagesTermsOfServiceUrl,
    schema_definition_url: `${config.apiVersionPath}${MBRSS_V1_STANDARD_PREFIX}/openapi.json`,
    sender_blocked: senderBlocked,
  };
  if (senderBlocked) {
    response.sender_block_message = SENDER_BLOCKED_MESSAGE;
  }
  if (resolved.isPublic) {
    response.public_messages_url = `${config.apiVersionPath}${MBRSS_V1_STANDARD_PREFIX}/messages/public/${resolved.bucketShortId}`;
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

  const body = req.body as CreateMbrssV1BoostBody;
  const normalizedValue = normalizeCurrencyAndAmountUnit({
    currency: body.currency,
    amount_unit: body.amount_unit,
  });

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

  if (await isSenderGuidBlockedForTargetBucket(targetBucketId, body.sender_guid)) {
    res.status(403).json({
      message: SENDER_BLOCKED_MESSAGE,
      code: 'sender_blocked',
    });
    return;
  }

  const persisted = await persistStandardBoostMessage({
    targetBucketId,
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
  const { page, limit, offset } = parsePageLimit(req.query);
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
  const messages = await BucketMessageService.findByBucketIds(bucketIds, {
    limit,
    offset,
    publicOnly: true,
    actions: ['boost'],
    order: 'DESC',
    excludeSenderGuids,
  });
  const total = await BucketMessageService.countByBucketIds(bucketIds, {
    publicOnly: true,
    actions: ['boost'],
    excludeSenderGuids,
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const messagesWithSourceContext = await withSourceBucketContext(messages);
  return {
    page,
    limit,
    total,
    totalPages,
    messages: messagesWithSourceContext,
  };
};

const toPublicStandardMessages = (
  messages: BucketMessage[],
  options: {
    currentLevel: 'channel' | 'item';
    podcastGuid: string;
    podcastLabel: string | null;
    itemGuidByBucketId: Map<string, string>;
  }
): PublicStandardMessage[] => {
  return messages.map((message) => {
    const sourceType = message.sourceBucketContext?.bucket.type;
    const itemGuid = options.itemGuidByBucketId.get(message.bucketId) ?? null;
    const isItemSubBucket = options.currentLevel === 'channel' && sourceType === 'rss-item';
    const breadcrumbContext: PublicBreadcrumbContext | null =
      isItemSubBucket && itemGuid !== null
        ? {
            level: 'item',
            podcastGuid: options.podcastGuid,
            podcastLabel: options.podcastLabel,
            itemGuid,
            itemLabel: message.sourceBucketContext?.bucket.name ?? null,
            isSubBucket: true,
          }
        : null;

    return {
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
      breadcrumbContext,
    };
  });
};

export async function listPublicMessages(req: Request, res: Response): Promise<void> {
  const bucketShortId = req.params.bucketShortId as string;
  const resolved = await resolveBoostBucket(bucketShortId);
  if (resolved === null || !resolved.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const channelInfo = await BucketRSSChannelInfoService.findByBucketId(resolved.bucketId);
  if (channelInfo === null) {
    res.status(404).json({ message: 'Channel not found for bucket' });
    return;
  }
  const bucketIds = [
    resolved.bucketId,
    ...(await BucketService.findDescendantIds(resolved.bucketId)),
  ];
  const result = await listPublicBucketMessagesByBucketIds(bucketIds, req);
  const publicMessages = toPublicStandardMessages(result.messages, {
    currentLevel: 'channel',
    podcastGuid: channelInfo.rssPodcastGuid,
    podcastLabel: channelInfo.rssChannelTitle,
    itemGuidByBucketId: new Map(),
  });
  res.status(200).json({
    messages: publicMessages,
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
  const bucketIds = [
    resolved.bucketId,
    ...(await BucketService.findDescendantIds(resolved.bucketId)),
  ];
  const result = await listPublicBucketMessagesByBucketIds(bucketIds, req);
  const sourceItemBucketIds = [
    ...new Set(
      result.messages
        .map((message) =>
          message.sourceBucketContext?.bucket.type === 'rss-item' ? message.bucketId : null
        )
        .filter((bucketId): bucketId is string => bucketId !== null)
    ),
  ];
  const itemGuidByBucketId = new Map<string, string>();
  await Promise.all(
    sourceItemBucketIds.map(async (bucketId) => {
      const itemInfo = await BucketRSSItemInfoService.findByBucketId(bucketId);
      if (itemInfo !== null) {
        itemGuidByBucketId.set(bucketId, itemInfo.rssItemGuid);
      }
    })
  );
  const publicMessages = toPublicStandardMessages(result.messages, {
    currentLevel: 'channel',
    podcastGuid: channelInfo.rssPodcastGuid,
    podcastLabel: channelInfo.rssChannelTitle,
    itemGuidByBucketId,
  });
  res.status(200).json({
    messages: publicMessages,
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
  const channelInfo = await BucketRSSChannelInfoService.findByBucketId(resolved.bucketId);
  if (channelInfo === null) {
    res.status(404).json({ message: 'Channel not found for bucket' });
    return;
  }
  const result = await listPublicBucketMessagesByBucketIds([itemInfo.bucketId], req);
  const publicMessages = toPublicStandardMessages(result.messages, {
    currentLevel: 'item',
    podcastGuid: channelInfo.rssPodcastGuid,
    podcastLabel: channelInfo.rssChannelTitle,
    itemGuidByBucketId: new Map([[itemInfo.bucketId, itemInfo.rssItemGuid]]),
  });
  res.status(200).json({
    messages: publicMessages,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}
