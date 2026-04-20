import type { BucketRSSChannelInfo } from '@metaboost/orm';
import type { NormalizedMinimalRssItem } from '@metaboost/rss-parser';

import {
  BucketRSSChannelInfoService,
  BucketRSSItemInfoService,
  BucketService,
} from '@metaboost/orm';
import {
  MinimalRssParserError,
  hashFeedContent,
  normalizeMinimalRss,
  parseMinimalRss,
} from '@metaboost/rss-parser';

import { assertRssOutboundFetchEnabled } from './rss-outbound.js';

const RSS_FETCH_TIMEOUT_MS = 10000;

export const MBRSS_V1_STANDARD_VALUE = 'mbrss-v1';

export type RssVerifyFailureReason = 'missing_meta_boost_tag' | 'meta_boost_url_mismatch';

export type RssSyncResult = {
  verified: boolean;
  verificationFailureReason: RssVerifyFailureReason | null;
  verificationMessage: string | null;
  expectedMetaBoostPublicUrl: string | null;
  actualMetaBoostUrl: string | null;
  parsedPodcastGuid: string;
  parsedChannelTitle: string;
  createdItemBuckets: number;
  updatedItemBuckets: number;
  orphanedItemBuckets: number;
  restoredItemBuckets: number;
  activeItemBuckets: number;
  totalFeedItemsWithGuid: number;
};

type RssChannelBucketSyncInput = {
  id: string;
  shortId: string;
  ownerId: string;
  isPublic: boolean;
};

function normalizePath(pathname: string): string {
  const trimmed = pathname.trim();
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

export function normalizeMbrssV1BoostUrlForCompare(urlValue: string): string | null {
  try {
    const parsed = new URL(urlValue);
    return `${parsed.origin}${normalizePath(parsed.pathname)}`;
  } catch {
    try {
      const parsedWithBase = new URL(urlValue, 'https://metaboost.local');
      return `${parsedWithBase.origin}${normalizePath(parsedWithBase.pathname)}`;
    } catch {
      return null;
    }
  }
}

function resolveItemBucketName(itemGuid: string, item: NormalizedMinimalRssItem): string {
  if (item.title !== null && item.title.trim() !== '') {
    return item.title;
  }
  return itemGuid;
}

function resolvePubDate(item: NormalizedMinimalRssItem): Date | undefined {
  if (item.pubDateTimestamp === null) {
    return undefined;
  }
  return new Date(item.pubDateTimestamp);
}

async function fetchNormalizedRss(
  rssFeedUrl: string
): Promise<{ normalized: ReturnType<typeof normalizeMinimalRss>; feedHash: string }> {
  assertRssOutboundFetchEnabled();
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
  return {
    normalized,
    feedHash: hashFeedContent(xml),
  };
}

function resolveChannelValue(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed === '' ? fallback : trimmed;
}

export async function verifyAndSyncRssChannelBucket(input: {
  bucket: RssChannelBucketSyncInput;
  channelInfo: BucketRSSChannelInfo;
  enforceMetaBoostPublicUrl?: string;
}): Promise<RssSyncResult> {
  const now = new Date();
  const expectedMetaBoostPublicUrl =
    input.enforceMetaBoostPublicUrl === undefined ? null : input.enforceMetaBoostPublicUrl.trim();

  const parseFailureResultBase: Omit<
    RssSyncResult,
    'verificationFailureReason' | 'verificationMessage'
  > = {
    verified: false,
    expectedMetaBoostPublicUrl,
    actualMetaBoostUrl: null,
    parsedPodcastGuid: input.channelInfo.rssPodcastGuid,
    parsedChannelTitle: input.channelInfo.rssChannelTitle,
    createdItemBuckets: 0,
    updatedItemBuckets: 0,
    orphanedItemBuckets: 0,
    restoredItemBuckets: 0,
    activeItemBuckets: 0,
    totalFeedItemsWithGuid: 0,
  };

  let normalized: ReturnType<typeof normalizeMinimalRss>;
  let feedHash: string;
  try {
    const parsed = await fetchNormalizedRss(input.channelInfo.rssFeedUrl);
    normalized = parsed.normalized;
    feedHash = parsed.feedHash;
  } catch (error) {
    await BucketRSSChannelInfoService.upsert({
      bucketId: input.bucket.id,
      rssFeedUrl: input.channelInfo.rssFeedUrl,
      rssPodcastGuid: input.channelInfo.rssPodcastGuid,
      rssChannelTitle: input.channelInfo.rssChannelTitle,
      rssLastParseAttempt: now,
      rssLastSuccessfulParse: input.channelInfo.rssLastSuccessfulParse,
      rssVerified: input.channelInfo.rssVerified,
      rssVerificationFailedAt: input.channelInfo.rssVerificationFailedAt ?? null,
      rssLastParsedFeedHash: null,
    });
    throw error;
  }

  const parsedPodcastGuid = resolveChannelValue(
    normalized.podcastGuid,
    input.channelInfo.rssPodcastGuid
  );
  const parsedChannelTitle = resolveChannelValue(
    normalized.channelTitle,
    input.channelInfo.rssChannelTitle
  );

  if (expectedMetaBoostPublicUrl !== null) {
    if (
      normalized.metaBoostUrl === null ||
      normalized.metaBoostStandard === null ||
      normalized.metaBoostStandard.toLowerCase() !== MBRSS_V1_STANDARD_VALUE
    ) {
      await BucketRSSChannelInfoService.upsert({
        bucketId: input.bucket.id,
        rssFeedUrl: input.channelInfo.rssFeedUrl,
        rssPodcastGuid: parsedPodcastGuid,
        rssChannelTitle: parsedChannelTitle,
        rssLastParseAttempt: now,
        rssLastSuccessfulParse: input.channelInfo.rssLastSuccessfulParse,
        rssVerified: null,
        rssVerificationFailedAt: now,
        rssLastParsedFeedHash: input.channelInfo.rssLastParsedFeedHash,
      });
      return {
        ...parseFailureResultBase,
        actualMetaBoostUrl: normalized.metaBoostUrl,
        parsedPodcastGuid,
        parsedChannelTitle,
        verificationFailureReason: 'missing_meta_boost_tag',
        verificationMessage: 'Feed is missing <podcast:metaBoost standard="mbrss-v1"> tag.',
      };
    }

    const expectedNorm = normalizeMbrssV1BoostUrlForCompare(expectedMetaBoostPublicUrl);
    const actualNorm = normalizeMbrssV1BoostUrlForCompare(normalized.metaBoostUrl);
    if (expectedNorm === null || actualNorm === null || actualNorm !== expectedNorm) {
      await BucketRSSChannelInfoService.upsert({
        bucketId: input.bucket.id,
        rssFeedUrl: input.channelInfo.rssFeedUrl,
        rssPodcastGuid: parsedPodcastGuid,
        rssChannelTitle: parsedChannelTitle,
        rssLastParseAttempt: now,
        rssLastSuccessfulParse: input.channelInfo.rssLastSuccessfulParse,
        rssVerified: null,
        rssVerificationFailedAt: now,
        rssLastParsedFeedHash: input.channelInfo.rssLastParsedFeedHash,
      });
      return {
        ...parseFailureResultBase,
        actualMetaBoostUrl: normalized.metaBoostUrl,
        parsedPodcastGuid,
        parsedChannelTitle,
        verificationFailureReason: 'meta_boost_url_mismatch',
        verificationMessage: 'Feed metaBoost URL does not match expected bucket boost URL.',
      };
    }
  }

  const existingItemInfos = await BucketRSSItemInfoService.listByParentChannelBucketId(
    input.bucket.id
  );
  const existingByGuid = new Map(
    existingItemInfos.map((itemInfo) => [itemInfo.rssItemGuid, itemInfo])
  );
  const seenGuids = new Set<string>();

  let createdItemBuckets = 0;
  let updatedItemBuckets = 0;
  let orphanedItemBuckets = 0;
  let restoredItemBuckets = 0;

  const itemEntries = Object.entries(normalized.itemsByGuid);
  for (const [itemGuid, item] of itemEntries) {
    seenGuids.add(itemGuid);
    const desiredName = resolveItemBucketName(itemGuid, item);
    const existing = existingByGuid.get(itemGuid);
    const desiredPubDate = resolvePubDate(item);

    if (existing === undefined) {
      const createdBucket = await BucketService.createRssItem({
        ownerId: input.bucket.ownerId,
        parentBucketId: input.bucket.id,
        name: desiredName,
        isPublic: input.bucket.isPublic,
      });
      await BucketRSSItemInfoService.upsert({
        bucketId: createdBucket.id,
        parentRssChannelBucketId: input.bucket.id,
        rssItemGuid: itemGuid,
        rssItemPubDate: desiredPubDate,
        orphaned: false,
      });
      createdItemBuckets += 1;
      continue;
    }

    let itemUpdated = false;
    const existingBucket = await BucketService.findById(existing.bucketId);
    if (existingBucket !== null && existingBucket.name !== desiredName) {
      await BucketService.update(existing.bucketId, { name: desiredName });
      itemUpdated = true;
    }

    const existingPubDateTime = existing.rssItemPubDate.getTime();
    const desiredPubDateTime = desiredPubDate?.getTime() ?? new Date(0).getTime();
    if (existing.orphaned) {
      restoredItemBuckets += 1;
      itemUpdated = true;
    }
    if (existingPubDateTime !== desiredPubDateTime || existing.orphaned) {
      await BucketRSSItemInfoService.upsert({
        bucketId: existing.bucketId,
        parentRssChannelBucketId: input.bucket.id,
        rssItemGuid: itemGuid,
        rssItemPubDate: desiredPubDate,
        orphaned: false,
      });
      itemUpdated = true;
    }

    if (itemUpdated) {
      updatedItemBuckets += 1;
    }
  }

  for (const existing of existingItemInfos) {
    if (!seenGuids.has(existing.rssItemGuid) && !existing.orphaned) {
      await BucketRSSItemInfoService.upsert({
        bucketId: existing.bucketId,
        parentRssChannelBucketId: input.bucket.id,
        rssItemGuid: existing.rssItemGuid,
        rssItemPubDate: existing.rssItemPubDate,
        orphaned: true,
      });
      orphanedItemBuckets += 1;
    }
  }

  await BucketRSSChannelInfoService.upsert({
    bucketId: input.bucket.id,
    rssFeedUrl: input.channelInfo.rssFeedUrl,
    rssPodcastGuid: parsedPodcastGuid,
    rssChannelTitle: parsedChannelTitle,
    rssLastParseAttempt: now,
    rssLastSuccessfulParse: now,
    rssVerified: expectedMetaBoostPublicUrl === null ? input.channelInfo.rssVerified : now,
    rssVerificationFailedAt:
      expectedMetaBoostPublicUrl === null
        ? (input.channelInfo.rssVerificationFailedAt ?? null)
        : null,
    rssLastParsedFeedHash: feedHash,
  });

  return {
    verified: true,
    verificationFailureReason: null,
    verificationMessage: null,
    expectedMetaBoostPublicUrl,
    actualMetaBoostUrl: normalized.metaBoostUrl,
    parsedPodcastGuid,
    parsedChannelTitle,
    createdItemBuckets,
    updatedItemBuckets,
    orphanedItemBuckets,
    restoredItemBuckets,
    activeItemBuckets: seenGuids.size,
    totalFeedItemsWithGuid: itemEntries.length,
  };
}
