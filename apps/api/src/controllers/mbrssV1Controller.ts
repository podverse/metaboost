import type { CreateMbrssV1BoostBody } from '../schemas/mbrssV1.js';
import type { BucketMessage } from '@metaboost/orm';
import type { Request, Response } from 'express';

import {
  DEFAULT_MESSAGE_BODY_MAX_LENGTH,
  MBRSS_V1_CURRENCY_BTC,
  MBRSS_V1_SATOSHIS_UNIT,
} from '@metaboost/helpers';
import {
  BucketMessageService,
  BucketRSSChannelInfoService,
  BucketRSSItemInfoService,
} from '@metaboost/orm';
import { MinimalRssParserError } from '@metaboost/rss-parser';

import { config } from '../config/index.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';
import { verifyAndSyncRssChannelBucket } from '../lib/rss-sync.js';

const MBRSS_V1_SCHEMA = 'mbrss-v1';
const MBRSS_V1_STANDARD_PREFIX = '/s/mbrss-v1';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const normalizeCurrencyAndAmountUnit = (input: {
  currency: string;
  amount_unit?: string;
}): { currency: string; amountUnit: string | null } => {
  const currency = input.currency.trim().toUpperCase();
  const rawAmountUnit = input.amount_unit?.trim();
  if (rawAmountUnit === undefined || rawAmountUnit === '') {
    return { currency, amountUnit: null };
  }
  if (currency === MBRSS_V1_CURRENCY_BTC) {
    const normalizedAmountUnit = rawAmountUnit.toLowerCase();
    const amountUnit =
      normalizedAmountUnit === MBRSS_V1_SATOSHIS_UNIT || normalizedAmountUnit === 'satoshi'
        ? MBRSS_V1_SATOSHIS_UNIT
        : rawAmountUnit;
    return { currency, amountUnit };
  }
  return { currency, amountUnit: rawAmountUnit };
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

  const response: {
    schema: string;
    message_char_limit: number;
    terms_of_service_url: string;
    schema_definition_url: string;
    public_messages_url?: string;
  } = {
    schema: MBRSS_V1_SCHEMA,
    message_char_limit: resolved.messageCharLimit,
    terms_of_service_url: config.messagesTermsOfServiceUrl,
    schema_definition_url: `${config.apiVersionPath}${MBRSS_V1_STANDARD_PREFIX}/openapi.json`,
  };
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

  if (body.action === 'stream') {
    await BucketMessageService.create({
      bucketId: targetBucketId,
      senderName: body.sender_name ?? body.app_name,
      body: null,
      currency: normalizedValue.currency,
      amount: body.amount,
      amountUnit: normalizedValue.amountUnit,
      action: body.action,
      appName: body.app_name,
      appVersion: body.app_version ?? null,
      senderId: body.sender_id ?? null,
      podcastIndexFeedId: body.podcast_index_feed_id ?? null,
      timePosition: body.time_position ?? null,
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
    currency: normalizedValue.currency,
    amount: body.amount,
    amountUnit: normalizedValue.amountUnit,
    action: body.action,
    appName: body.app_name,
    appVersion: body.app_version ?? null,
    senderId: body.sender_id ?? null,
    podcastIndexFeedId: body.podcast_index_feed_id ?? null,
    timePosition: body.time_position ?? null,
    isPublic: true,
  });

  res.status(201).json({ message_guid: storedMessage.id });
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
  const messages = await BucketMessageService.findByBucketId(bucketId, {
    limit,
    offset,
    publicOnly: true,
    actions: ['boost'],
    order: 'DESC',
  });
  const total = await BucketMessageService.countByBucketId(bucketId, {
    publicOnly: true,
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
