import type {
  CreateBucketBody,
  UpdateBucketBody,
  CreateChildBucketBody,
} from '../schemas/buckets.js';
import type { Bucket } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { BucketService, BucketMessageService, BucketRSSChannelInfoService } from '@metaboost/orm';
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
  rssLastParsedFeedHash: string | null;
};

type BucketApiResponse = ReturnType<typeof toBucketResponse> & {
  rss: BucketRssInfoResponse | null;
};

type ParsedRssChannel = {
  channelTitle: string;
  podcastGuid: string;
};

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

async function toBucketApiResponse(
  bucket: Bucket,
  overrides?: Parameters<typeof toBucketResponse>[1]
): Promise<BucketApiResponse> {
  const base = toBucketResponse(bucket, overrides);
  if (bucket.type !== 'rss-channel') {
    return { ...base, rss: null };
  }

  const rssInfo = await BucketRSSChannelInfoService.findByBucketId(bucket.id);
  if (rssInfo === null) {
    return { ...base, rss: null };
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
      rssLastParsedFeedHash: rssInfo.rssLastParsedFeedHash,
    },
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
  const parentIds = [
    ...new Set(
      buckets
        .map((b) => b.parentBucketId)
        .filter((id): id is string => id !== null && id !== undefined)
    ),
  ];
  const pairs = await Promise.all(
    parentIds.map(async (id) => {
      const parent = await BucketService.findById(id);
      return [id, parent] as [string, Awaited<ReturnType<typeof BucketService.findById>>];
    })
  );
  const parentMap = new Map(pairs);
  const bucketResponses = await Promise.all(
    buckets.map(async (bucket) => {
      if (bucket.parentBucketId !== null) {
        const parent = parentMap.get(bucket.parentBucketId) ?? null;
        const overrides =
          parent !== null
            ? {
                messageBodyMaxLength: parent.settings?.messageBodyMaxLength ?? null,
                ownerId: parent.ownerId,
              }
            : undefined;
        return toBucketApiResponse(bucket, overrides);
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
    if (body.type === 'group') {
      const bucket = await BucketService.createGroup({
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
        message: 'Validation failed',
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
  const { bucket, effectiveBucket, effectiveSettings } = ctx.resolved;
  const overrides =
    bucket.parentBucketId !== null
      ? {
          messageBodyMaxLength: effectiveSettings?.messageBodyMaxLength ?? null,
          ownerId: effectiveBucket.ownerId,
        }
      : undefined;
  res.status(200).json({ bucket: await toBucketApiResponse(bucket, overrides) });
}

export async function updateBucket(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'id', can: canUpdateBucket });
  if (ctx === null) return;
  const { resolved } = ctx;
  const { bucket, effectiveBucket, isDescendant } = resolved;
  const body = req.body as UpdateBucketBody;
  if (isDescendant) {
    if (body.name === undefined) {
      res.status(400).json({
        message:
          'Descendant buckets inherit settings from the root bucket; only name can be updated.',
      });
      return;
    }
    if (body.isPublic !== undefined || body.messageBodyMaxLength !== undefined) {
      res.status(400).json({
        message:
          'Descendant buckets inherit settings from the root bucket; only name can be updated.',
      });
      return;
    }
    await BucketService.update(bucket.id, { name: body.name });
  } else {
    await BucketService.update(bucket.id, {
      name: body.name,
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
          messageBodyMaxLength: ctx.resolved.effectiveSettings?.messageBodyMaxLength ?? null,
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
  const { bucket: parent, effectiveBucket, effectiveSettings } = ctx.resolved;
  const childBuckets = await BucketService.findChildren(parent.id);
  const childBucketIds = childBuckets.map((childBucket) => childBucket.id);
  const lastMessageAtMap =
    await BucketMessageService.getLatestMessageCreatedAtByBucketIds(childBucketIds);
  const inheritedOverrides = {
    messageBodyMaxLength: effectiveSettings?.messageBodyMaxLength ?? null,
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
  const { bucket: parent, effectiveBucket, effectiveSettings } = ctx.resolved;
  const body = req.body as CreateChildBucketBody;
  if (parent.type !== 'group') {
    res.status(400).json({
      message: 'Child buckets can only be created under group buckets.',
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
        message: 'Validation failed',
        details: [{ path: 'rssFeedUrl', message: error.message }],
      });
      return;
    }
    throw error;
  }

  const overrides = {
    messageBodyMaxLength: effectiveSettings?.messageBodyMaxLength ?? null,
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

  const expectedMetaBoostPath = `${config.apiVersionPath}/s/mb1/boost/${bucket.shortId}`;
  try {
    const result = await verifyAndSyncRssChannelBucket({
      bucket,
      channelInfo,
      verifyMetaBoostPath: expectedMetaBoostPath,
    });
    if (!result.verified) {
      res.status(400).json({
        message: result.verificationMessage ?? 'RSS verification failed.',
        details: {
          reason: result.verificationFailureReason,
          expectedMetaBoostPath: result.expectedMetaBoostPath,
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
