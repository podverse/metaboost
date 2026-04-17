import type {
  CreateBucketBody,
  UpdateBucketBody,
  CreateChildBucketBody,
} from '../schemas/buckets.js';
import type { Bucket } from '@metaboost/orm';
import type { Request, Response } from 'express';

import {
  BucketService,
  BucketMessageService,
  BucketRSSChannelInfoService,
  BucketRSSItemInfoService,
} from '@metaboost/orm';
import { normalizeMinimalRss, parseMinimalRss, MinimalRssParserError } from '@metaboost/rss-parser';

import { config } from '../config/index.js';
import { getBucketContext } from '../lib/bucket-context.js';
import {
  canReadBucket,
  canUpdateBucket,
  canDeleteBucket,
  canCreateBucket,
} from '../lib/bucket-policy.js';
import { toBucketResponse } from '../lib/bucket-response.js';
import { verifyAndSyncRssChannelBucket } from '../lib/rss-sync.js';

const RSS_FETCH_TIMEOUT_MS = 10000;

type BucketRssInfoResponse = {
  rssFeedUrl: string;
  rssPodcastGuid: string;
  rssChannelTitle: string;
  rssLastParseAttempt: string | null;
  rssLastSuccessfulParse: string | null;
  rssVerified: string | null;
  rssVerificationFailedAt: string | null;
  rssLastParsedFeedHash: string | null;
};

type BucketApiResponse = ReturnType<typeof toBucketResponse> & {
  rss: BucketRssInfoResponse | null;
  rssItem: {
    rssItemGuid: string;
    rssItemPubDate: string;
    orphaned: boolean;
  } | null;
};

type ParsedRssChannel = {
  channelTitle: string;
  podcastGuid: string;
};

const DERIVED_NAME_BUCKET_TYPES: Bucket['type'][] = ['rss-channel', 'rss-item'];

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

async function toBucketApiResponse(
  bucket: Bucket,
  overrides?: Parameters<typeof toBucketResponse>[1]
): Promise<BucketApiResponse> {
  const base = toBucketResponse(bucket, overrides);
  if (bucket.type !== 'rss-channel') {
    if (bucket.type === 'rss-item') {
      const rssItemInfo = await BucketRSSItemInfoService.findByBucketId(bucket.id);
      return {
        ...base,
        rss: null,
        rssItem:
          rssItemInfo === null
            ? null
            : {
                rssItemGuid: rssItemInfo.rssItemGuid,
                rssItemPubDate: rssItemInfo.rssItemPubDate.toISOString(),
                orphaned: rssItemInfo.orphaned,
              },
      };
    }
    return { ...base, rss: null, rssItem: null };
  }

  const rssInfo = await BucketRSSChannelInfoService.findByBucketId(bucket.id);
  if (rssInfo === null) {
    return { ...base, rss: null, rssItem: null };
  }

  return {
    ...base,
    rss: {
      rssFeedUrl: rssInfo.rssFeedUrl,
      rssPodcastGuid: rssInfo.rssPodcastGuid,
      rssChannelTitle: rssInfo.rssChannelTitle,
      rssLastParseAttempt: toIsoOrNull(rssInfo.rssLastParseAttempt),
      rssLastSuccessfulParse: toIsoOrNull(rssInfo.rssLastSuccessfulParse),
      rssVerified: toIsoOrNull(rssInfo.rssVerified),
      rssVerificationFailedAt: toIsoOrNull(rssInfo.rssVerificationFailedAt),
      rssLastParsedFeedHash: rssInfo.rssLastParsedFeedHash,
    },
    rssItem: null,
  };
}

async function parseRssChannelFromFeedUrl(rssFeedUrl: string): Promise<ParsedRssChannel> {
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), RSS_FETCH_TIMEOUT_MS);

  let xml: string;
  try {
    const response = await fetch(rssFeedUrl, { signal: abortController.signal });
    if (!response.ok) {
      throw new MinimalRssParserError({
        code: 'invalid_input',
        message: `Feed URL returned HTTP ${response.status}.`,
      });
    }
    xml = await response.text();
  } catch (error) {
    if (error instanceof MinimalRssParserError) {
      throw error;
    }
    throw new MinimalRssParserError({
      code: 'invalid_input',
      message: 'Failed to fetch RSS feed URL.',
      details: error,
    });
  } finally {
    clearTimeout(timer);
  }

  const parsed = parseMinimalRss(xml);
  const normalized = normalizeMinimalRss(parsed);
  if (normalized.channelTitle === '') {
    throw new MinimalRssParserError({
      code: 'missing_channel',
      message: 'RSS feed missing channel title.',
      details: { field: 'channelTitle' },
    });
  }
  if (normalized.podcastGuid === '') {
    throw new MinimalRssParserError({
      code: 'missing_channel',
      message: 'RSS feed missing podcast guid.',
      details: { field: 'podcastGuid' },
    });
  }

  return {
    channelTitle: normalized.channelTitle,
    podcastGuid: normalized.podcastGuid,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

async function isAncestorChainPublic(bucket: Bucket): Promise<boolean> {
  let parentId = bucket.parentBucketId;
  while (parentId !== null) {
    const parent = await BucketService.findById(parentId);
    if (parent === null) {
      return false;
    }
    if (!parent.isPublic) {
      return false;
    }
    parentId = parent.parentBucketId;
  }
  return true;
}

async function createRssChannelBucket(input: {
  ownerId: string;
  parentBucketId: string | null;
  rssFeedUrl: string;
  isPublic: boolean;
}): Promise<Bucket> {
  const parsed = await parseRssChannelFromFeedUrl(input.rssFeedUrl);
  const existing = await BucketRSSChannelInfoService.findByPodcastGuid(parsed.podcastGuid);
  if (existing !== null) {
    throw new MinimalRssParserError({
      code: 'invalid_input',
      message: 'RSS channel already exists for this podcast guid.',
      details: { field: 'rssFeedUrl' },
    });
  }

  const bucket = await BucketService.createRssChannel({
    ownerId: input.ownerId,
    parentBucketId: input.parentBucketId,
    name: parsed.channelTitle,
    isPublic: input.isPublic,
  });
  try {
    await BucketRSSChannelInfoService.upsert({
      bucketId: bucket.id,
      rssFeedUrl: input.rssFeedUrl,
      rssPodcastGuid: parsed.podcastGuid,
      rssChannelTitle: parsed.channelTitle,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new MinimalRssParserError({
        code: 'invalid_input',
        message: 'RSS channel already exists for this podcast guid.',
        details: { field: 'rssFeedUrl' },
      });
    }
    throw error;
  }
  return bucket;
}

export async function listBuckets(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const search =
    typeof req.query.search === 'string' && req.query.search.trim() !== ''
      ? req.query.search.trim()
      : undefined;
  const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : undefined;
  const sortBy = sortByRaw === '' ? undefined : sortByRaw;
  const sortOrderRaw = req.query.sortOrder;
  const sortOrder = sortOrderRaw === 'asc' || sortOrderRaw === 'desc' ? sortOrderRaw : undefined;
  const buckets = await BucketService.findAccessibleByUser(user.id, {
    search,
    sortBy,
    sortOrder,
  });
  const bucketResponses = await Promise.all(
    buckets.map(async (bucket) => {
      if (bucket.parentBucketId !== null) {
        return toBucketApiResponse(bucket);
      }
      return toBucketApiResponse(bucket);
    })
  );
  res.status(200).json({ buckets: bucketResponses });
}

export async function createBucket(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const body = req.body as CreateBucketBody;
  try {
    if (body.type === 'rss-network') {
      const bucket = await BucketService.createRssNetwork({
        ownerId: user.id,
        name: body.name,
        isPublic: body.isPublic ?? true,
        parentBucketId: null,
      });
      res.status(201).json({ bucket: await toBucketApiResponse(bucket) });
      return;
    }

    const bucket = await createRssChannelBucket({
      ownerId: user.id,
      parentBucketId: null,
      rssFeedUrl: body.rssFeedUrl,
      isPublic: body.isPublic ?? true,
    });
    res.status(201).json({ bucket: await toBucketApiResponse(bucket) });
  } catch (error) {
    if (error instanceof MinimalRssParserError) {
      res.status(400).json({
        message: error.message,
        details: [{ path: 'rssFeedUrl', message: error.message }],
      });
      return;
    }
    throw error;
  }
}

export async function getBucket(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'id', can: canReadBucket });
  if (ctx === null) return;
  const { bucket, effectiveBucket } = ctx.resolved;
  const overrides =
    bucket.parentBucketId !== null
      ? {
          ownerId: effectiveBucket.ownerId,
        }
      : undefined;
  res.status(200).json({ bucket: await toBucketApiResponse(bucket, overrides) });
}

export async function updateBucket(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'id', can: canUpdateBucket });
  if (ctx === null) return;
  const { resolved } = ctx;
  const { bucket, effectiveBucket } = resolved;
  const body = req.body as UpdateBucketBody;
  if (body.name !== undefined && DERIVED_NAME_BUCKET_TYPES.includes(bucket.type)) {
    res.status(400).json({
      message: 'Name is derived for RSS channel and item buckets and cannot be edited manually.',
    });
    return;
  }
  if (body.isPublic === true && bucket.parentBucketId !== null) {
    const canSetPublic = await isAncestorChainPublic(bucket);
    if (!canSetPublic) {
      res.status(400).json({
        message: 'A descendant bucket can only be public when all ancestor buckets are public.',
      });
      return;
    }
  }
  await BucketService.update(bucket.id, {
    name: body.name,
    isPublic: body.isPublic,
    messageBodyMaxLength: body.messageBodyMaxLength,
  });
  if (body.applyToDescendants === true) {
    await BucketService.applyGeneralSettingsToDescendants(bucket.id, {
      isPublic: body.isPublic,
      messageBodyMaxLength: body.messageBodyMaxLength,
    });
  }
  const updated = await BucketService.findById(bucket.id);
  if (updated === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const overrides =
    updated.parentBucketId !== null
      ? {
          ownerId: effectiveBucket.ownerId,
        }
      : undefined;
  res.status(200).json({ bucket: await toBucketApiResponse(updated, overrides) });
}

export async function deleteBucket(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'id', can: canDeleteBucket });
  if (ctx === null) return;
  const { bucket } = ctx.resolved;
  await BucketService.delete(bucket.id);
  res.status(204).send();
}

export async function listChildBuckets(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canReadBucket });
  if (ctx === null) return;
  const { bucket: parent, effectiveBucket } = ctx.resolved;
  const childBuckets = await BucketService.findChildren(parent.id);
  const childBucketIds = childBuckets.map((childBucket) => childBucket.id);
  const lastMessageAtMap =
    await BucketMessageService.getLatestMessageCreatedAtByBucketIds(childBucketIds);
  const inheritedOverrides = {
    ownerId: effectiveBucket.ownerId,
  };
  res.status(200).json({
    buckets: await Promise.all(
      childBuckets.map((childBucket) =>
        toBucketApiResponse(childBucket, {
          ...inheritedOverrides,
          lastMessageAt: lastMessageAtMap.get(childBucket.id)?.toISOString() ?? null,
        })
      )
    ),
  });
}

export async function createChildBucket(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canCreateBucket });
  if (ctx === null) return;
  const { bucket: parent, effectiveBucket } = ctx.resolved;
  const body = req.body as CreateChildBucketBody;
  if (parent.type !== 'rss-network') {
    res.status(400).json({
      message: 'Child buckets can only be created under RSS Network buckets.',
    });
    return;
  }
  if (!BucketService.isAllowedChildType(parent.type, body.type)) {
    res.status(400).json({
      message: 'Invalid child bucket type for parent bucket.',
    });
    return;
  }

  let childBucket: Bucket;
  try {
    childBucket = await createRssChannelBucket({
      ownerId: effectiveBucket.ownerId,
      parentBucketId: parent.id,
      rssFeedUrl: body.rssFeedUrl,
      isPublic: body.isPublic ?? true,
    });
  } catch (error) {
    if (error instanceof MinimalRssParserError) {
      res.status(400).json({
        message: error.message,
        details: [{ path: 'rssFeedUrl', message: error.message }],
      });
      return;
    }
    throw error;
  }

  const overrides = {
    ownerId: effectiveBucket.ownerId,
  };
  res.status(201).json({ bucket: await toBucketApiResponse(childBucket, overrides) });
}

export async function verifyRssChannel(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canUpdateBucket });
  if (ctx === null) {
    return;
  }
  const { bucket } = ctx.resolved;
  if (bucket.type !== 'rss-channel') {
    res.status(400).json({
      message: 'RSS verification is only available for rss-channel buckets.',
    });
    return;
  }

  const channelInfo = await BucketRSSChannelInfoService.findByBucketId(bucket.id);
  if (channelInfo === null || channelInfo.rssFeedUrl.trim() === '') {
    res.status(400).json({
      message: 'RSS channel metadata is missing rssFeedUrl for this bucket.',
    });
    return;
  }

  const enforceMetaBoostPublicUrl = `${config.apiPublicBaseUrl}${config.apiVersionPath}/standard/mbrss-v1/boost/${bucket.shortId}/`;
  try {
    const result = await verifyAndSyncRssChannelBucket({
      bucket,
      channelInfo,
      enforceMetaBoostPublicUrl,
    });
    if (!result.verified) {
      res.status(400).json({
        message: result.verificationMessage ?? 'RSS verification failed.',
        details: {
          reason: result.verificationFailureReason,
          expectedMetaBoostPublicUrl: result.expectedMetaBoostPublicUrl,
          actualMetaBoostUrl: result.actualMetaBoostUrl,
        },
      });
      return;
    }

    res.status(200).json({
      verified: true,
      parsedPodcastGuid: result.parsedPodcastGuid,
      parsedChannelTitle: result.parsedChannelTitle,
      sync: {
        totalFeedItemsWithGuid: result.totalFeedItemsWithGuid,
        activeItemBuckets: result.activeItemBuckets,
        createdItemBuckets: result.createdItemBuckets,
        updatedItemBuckets: result.updatedItemBuckets,
        orphanedItemBuckets: result.orphanedItemBuckets,
        restoredItemBuckets: result.restoredItemBuckets,
      },
    });
  } catch (error) {
    if (error instanceof MinimalRssParserError) {
      res.status(400).json({
        message: `RSS parse failed: ${error.message}`,
      });
      return;
    }
    throw error;
  }
}
