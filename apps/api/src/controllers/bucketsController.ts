import type {
  CreateBucketBody,
  UpdateBucketBody,
  CreateChildBucketBody,
} from '../schemas/buckets.js';
import type { Bucket } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { compareStringsEmptyLastLexicographic, parseSortOrderQueryParam } from '@metaboost/helpers';
import { normalizeCurrencyCode } from '@metaboost/helpers-currency';
import {
  BucketService,
  BucketMessageService,
  BucketRSSChannelInfoService,
  BucketRSSItemInfoService,
} from '@metaboost/orm';
import { normalizeMinimalRss, parseMinimalRss, MinimalRssParserError } from '@metaboost/rss-parser';

import { config } from '../config/index.js';
import { listBlockedSenderGuidsForBucket } from '../lib/blocked-sender-scope.js';
import { getBucketContext } from '../lib/bucket-context.js';
import {
  canReadBucket,
  canUpdateBucket,
  canDeleteBucket,
  canCreateBucket,
} from '../lib/bucket-policy.js';
import { toBucketResponse } from '../lib/bucket-response.js';
import {
  convertToBaselineMinorAmount,
  ExchangeRatesFetchDisabledError,
  getExchangeRates,
} from '../lib/exchangeRates.js';
import { recomputeRootThresholdSnapshots } from '../lib/recompute-threshold-snapshots.js';
import { fetchRssFeedXmlWithTimeout } from '../lib/rss-safe-fetch.js';
import { verifyAndSyncRssChannelBucket } from '../lib/rss-sync.js';
const DEFAULT_MINIMUM_BOOST_USD_AMOUNT_MINOR = 10;
const DEFAULT_MINIMUM_BOOST_USD_AMOUNT_UNIT = 'cents';
const DEFAULT_MINIMUM_BOOST_USD_CURRENCY = 'USD';

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
  let xml: string;
  try {
    xml = await fetchRssFeedXmlWithTimeout(rssFeedUrl);
  } catch (error) {
    if (error instanceof MinimalRssParserError) {
      throw error;
    }
    throw new MinimalRssParserError({
      code: 'invalid_input',
      message: 'Failed to fetch RSS feed URL.',
      details: error,
    });
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
  topLevelPreferredCurrency?: string;
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
    topLevelPreferredCurrency: input.topLevelPreferredCurrency,
    topLevelMinimumMessageAmountMinor:
      input.parentBucketId === null
        ? await resolveDefaultMinimumBoostAmountMinor(
            normalizeCurrencyCode(input.topLevelPreferredCurrency ?? null) ??
              BucketService.DEFAULT_PREFERRED_CURRENCY
          )
        : undefined,
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
  const bucketWithSettings = await BucketService.findById(bucket.id);
  if (bucketWithSettings === null) {
    throw new Error('Created RSS channel bucket could not be reloaded.');
  }
  return bucketWithSettings;
}

async function resolveDefaultMinimumBoostAmountMinor(preferredCurrency: string): Promise<number> {
  const normalizedPreferredCurrency =
    normalizeCurrencyCode(preferredCurrency) ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
  if (normalizedPreferredCurrency === DEFAULT_MINIMUM_BOOST_USD_CURRENCY) {
    return DEFAULT_MINIMUM_BOOST_USD_AMOUNT_MINOR;
  }
  const rates = await getExchangeRates();
  const converted = convertToBaselineMinorAmount(
    {
      amount: DEFAULT_MINIMUM_BOOST_USD_AMOUNT_MINOR,
      currency: DEFAULT_MINIMUM_BOOST_USD_CURRENCY,
      amountUnit: DEFAULT_MINIMUM_BOOST_USD_AMOUNT_UNIT,
    },
    normalizedPreferredCurrency,
    rates
  );
  if (converted === null) {
    throw new Error('Unable to convert default minimum boost amount to preferred currency.');
  }
  return converted;
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
  const sortOrder = parseSortOrderQueryParam(req.query.sortOrder);
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
  if (!config.rssFeedFetchEnabled && (body.type === 'rss-network' || body.type === 'rss-channel')) {
    res.status(403).json({
      message:
        'RSS-backed bucket types are unavailable (API_RSS_FEED_FETCH_ENABLED is not true). Create a MetaBoost custom bucket (type mb-root) instead.',
      code: 'rss_buckets_disabled',
    });
    return;
  }
  const ownerPreferredCurrency =
    normalizeCurrencyCode(user.bio?.preferredCurrency ?? null) ?? undefined;
  try {
    if (body.type === 'rss-network') {
      const createdBucket = await BucketService.createRssNetwork({
        ownerId: user.id,
        name: body.name,
        isPublic: body.isPublic ?? true,
        parentBucketId: null,
        topLevelPreferredCurrency: ownerPreferredCurrency,
        topLevelMinimumMessageAmountMinor: await resolveDefaultMinimumBoostAmountMinor(
          normalizeCurrencyCode(ownerPreferredCurrency ?? null) ??
            BucketService.DEFAULT_PREFERRED_CURRENCY
        ),
      });
      const bucket = await BucketService.findById(createdBucket.id);
      if (bucket === null) {
        throw new Error('Created bucket could not be reloaded.');
      }
      res.status(201).json({ bucket: await toBucketApiResponse(bucket) });
      return;
    }
    if (body.type === 'mb-root') {
      const createdBucket = await BucketService.createMbRoot({
        ownerId: user.id,
        name: body.name,
        isPublic: body.isPublic ?? true,
        topLevelPreferredCurrency: ownerPreferredCurrency,
        topLevelMinimumMessageAmountMinor: await resolveDefaultMinimumBoostAmountMinor(
          normalizeCurrencyCode(ownerPreferredCurrency ?? null) ??
            BucketService.DEFAULT_PREFERRED_CURRENCY
        ),
      });
      const bucket = await BucketService.findById(createdBucket.id);
      if (bucket === null) {
        throw new Error('Created bucket could not be reloaded.');
      }
      res.status(201).json({ bucket: await toBucketApiResponse(bucket) });
      return;
    }

    const bucket = await createRssChannelBucket({
      ownerId: user.id,
      parentBucketId: null,
      rssFeedUrl: body.rssFeedUrl,
      isPublic: body.isPublic ?? true,
      topLevelPreferredCurrency: ownerPreferredCurrency,
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
    if (error instanceof ExchangeRatesFetchDisabledError) {
      res.status(503).json({ message: error.message });
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
  const nextPreferredCurrency =
    body.preferredCurrency === undefined
      ? undefined
      : normalizeCurrencyCode(body.preferredCurrency);
  const currentPreferredCurrency =
    bucket.settings?.preferredCurrency ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
  if (
    bucket.parentBucketId === null &&
    nextPreferredCurrency !== undefined &&
    nextPreferredCurrency !== null &&
    nextPreferredCurrency !== currentPreferredCurrency
  ) {
    try {
      await recomputeRootThresholdSnapshots(bucket.id, nextPreferredCurrency);
    } catch {
      res.status(503).json({
        message: 'Unable to recompute threshold snapshots for preferred currency change.',
      });
      return;
    }
  }
  await BucketService.update(bucket.id, {
    name: body.name,
    isPublic: body.isPublic,
    messageBodyMaxLength: body.messageBodyMaxLength,
    preferredCurrency: body.preferredCurrency,
    minimumMessageAmountMinor: body.minimumMessageAmountMinor,
  });
  if (body.applyToDescendants === true) {
    await BucketService.applyGeneralSettingsToDescendants(bucket.id, {
      isPublic: body.isPublic,
      messageBodyMaxLength: body.messageBodyMaxLength,
      preferredCurrency: body.preferredCurrency,
      minimumMessageAmountMinor: body.minimumMessageAmountMinor,
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
  const search =
    typeof req.query.search === 'string' && req.query.search.trim() !== ''
      ? req.query.search.trim()
      : undefined;
  const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : '';
  const sortOrder = parseSortOrderQueryParam(req.query.sortOrder);

  const childBuckets = await BucketService.findChildren(parent.id, {
    search,
    sortBy: sortByRaw !== '' ? sortByRaw : undefined,
    sortOrder,
  });
  const childBucketIds = childBuckets.map((childBucket) => childBucket.id);
  const excludeSenderGuids = await listBlockedSenderGuidsForBucket(parent.id);
  const lastMessageAtMap = await BucketMessageService.getLatestMessageCreatedAtByBucketIds(
    childBucketIds,
    { excludeSenderGuids }
  );

  let orderedBuckets = childBuckets;
  if (sortByRaw === 'lastMessage' && sortOrder !== undefined) {
    orderedBuckets = [...childBuckets].sort((a, b) =>
      compareStringsEmptyLastLexicographic(
        lastMessageAtMap.get(a.id)?.toISOString() ?? '',
        lastMessageAtMap.get(b.id)?.toISOString() ?? '',
        sortOrder
      )
    );
  }

  const inheritedOverrides = {
    ownerId: effectiveBucket.ownerId,
  };
  res.status(200).json({
    buckets: await Promise.all(
      orderedBuckets.map((childBucket) =>
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
  if (!config.rssFeedFetchEnabled && body.type === 'rss-channel') {
    res.status(403).json({
      message:
        'RSS channel buckets are unavailable (API_RSS_FEED_FETCH_ENABLED is not true). Create mb-mid or mb-leaf buckets instead.',
      code: 'rss_buckets_disabled',
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
    if (body.type === 'rss-channel') {
      childBucket = await createRssChannelBucket({
        ownerId: effectiveBucket.ownerId,
        parentBucketId: parent.id,
        rssFeedUrl: body.rssFeedUrl,
        isPublic: body.isPublic ?? true,
      });
    } else if (body.type === 'mb-mid') {
      childBucket = await BucketService.createMbMid({
        ownerId: effectiveBucket.ownerId,
        parentBucketId: parent.id,
        name: body.name.trim(),
        isPublic: body.isPublic ?? true,
      });
    } else {
      childBucket = await BucketService.createMbLeaf({
        ownerId: effectiveBucket.ownerId,
        parentBucketId: parent.id,
        name: body.name.trim(),
        isPublic: body.isPublic ?? true,
      });
    }
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
  if (!config.rssFeedFetchEnabled) {
    res.status(403).json({
      message: 'RSS verification requires outbound feed fetch (API_RSS_FEED_FETCH_ENABLED).',
      code: 'rss_feed_fetch_disabled',
    });
    return;
  }
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
