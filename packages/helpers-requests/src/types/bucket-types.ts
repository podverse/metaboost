/**
 * Bucket and related types for web bucket API responses.
 * Kept in sync with API response shapes (apps/api).
 */

import type { MbrssV1ActionValue } from '@metaboost/helpers';

/** RSS-derived bucket hierarchy (`rss-network` → `rss-channel` → `rss-item`). */
export type RssBucketType = 'rss-network' | 'rss-channel' | 'rss-item';

/** MetaBoost Custom (non-RSS) bucket hierarchy (`mb-root` → `mb-mid` → `mb-leaf`). */
export type MbBucketType = 'mb-root' | 'mb-mid' | 'mb-leaf';

/** All values allowed for persisted `bucket.type`. */
export type BucketType = RssBucketType | MbBucketType;

export type Bucket = {
  id: string;
  shortId: string;
  ownerId: string;
  name: string;
  type: BucketType;
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number;
  preferredCurrency: string;
  minimumMessageAmountMinor: number;
  conversionEndpointUrl: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  rss?: {
    rssFeedUrl: string;
    rssPodcastGuid: string;
    rssChannelTitle: string;
    rssLastParseAttempt: string | null;
    rssLastSuccessfulParse: string | null;
    rssVerified: string | null;
    rssVerificationFailedAt: string | null;
    rssLastParsedFeedHash: string | null;
  } | null;
  rssItem?: {
    rssItemGuid: string;
    rssItemPubDate: string;
    orphaned: boolean;
  } | null;
};

/** Parent bucket in root-to-leaf order for breadcrumbs (public API). */
export type PublicBucketAncestor = { shortId: string; name: string };

export type PublicBucket = {
  id: string;
  shortId: string;
  name: string;
  type: BucketType;
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number;
  preferredCurrency: string;
  minimumMessageAmountMinor: number;
  conversionEndpointUrl: string;
  /** Parent chain from root to immediate parent (public parents only). */
  ancestors: PublicBucketAncestor[];
};

export type PublicBucketConversion = {
  source: {
    currency: string;
    amountMinor: number;
    amountUnit: string;
  };
  target: {
    currency: string;
    amountMinor: number;
    amountUnit: string;
  };
  metadata: {
    exchangeRatesFetchedAt: string;
    fiatBaseCurrency: string;
    serverStandardCurrency: string;
  };
};

export type PublicExchangeRatesConversion = {
  source: {
    currency: string;
    amountMinor: number;
    amountUnit: string;
  };
  conversions: Array<{
    currency: string;
    amountMinor: number;
    amountUnit: string;
  }>;
  metadata: {
    exchangeRatesFetchedAt: string;
    fiatBaseCurrency: string;
    serverStandardCurrency: string;
    supportedCurrencies: string[];
    currencyUnits: Record<string, string>;
  };
};

export type BucketMessageSourceBucketSummary = {
  id: string;
  shortId: string;
  name: string;
  type: BucketType;
};

export type BucketMessageSourceBucketContext = {
  bucket: BucketMessageSourceBucketSummary;
  parentBucket: BucketMessageSourceBucketSummary | null;
};

/** Blocked sender row (tree root bucket). */
export type BucketBlockedSender = {
  id: string;
  rootBucketId: string;
  senderGuid: string;
  labelSnapshot: string | null;
  createdAt: string;
};

/** Blocked app row (tree root bucket). */
export type BucketBlockedApp = {
  id: string;
  rootBucketId: string;
  appId: string;
  appNameSnapshot: string | null;
  createdAt: string;
};

export type RegistryBucketAppPolicyItem = {
  appId: string;
  displayName: string;
  status: 'active' | 'suspended' | 'revoked';
  bucketBlocked: boolean;
  bucketBlockedId: string | null;
  globallyBlocked: boolean;
  blockedEverywhere: boolean;
  blockedEverywhereReason: 'registry' | 'global_override' | null;
};

export type BucketMessage = {
  id: string;
  messageGuid?: string | null;
  bucketId: string;
  senderName: string | null;
  body: string;
  createdAt: string;
  currency?: string | null;
  amount?: string | null;
  amountUnit?: string | null;
  appName?: string | null;
  appVersion?: string | null;
  senderGuid?: string | null;
  podcastIndexFeedId?: number | null;
  timePosition?: string | null;
  action?: MbrssV1ActionValue;
  sourceBucketContext?: BucketMessageSourceBucketContext;
};

export type BucketSummaryRangePreset = '24h' | '7d' | '30d' | '1y' | 'all-time' | 'custom';

export type BucketSummaryRange = {
  preset: BucketSummaryRangePreset;
  from: string | null;
  to: string | null;
};

export type BucketSummaryBreakdownRow = {
  currency: string | null;
  amountUnit: string | null;
  totalAmount: string;
  convertedAmount: string | null;
  messageCount: number;
  includedInConvertedTotal: boolean;
};

export type BucketSummarySeriesPoint = {
  bucketStart: string;
  convertedAmount: string;
  messageCount: number;
};

export type BucketSummaryData = {
  baselineCurrency: string;
  range: BucketSummaryRange;
  totals: {
    convertedAmount: string;
    messageCount: number;
    ignoredConversionEntries: number;
  };
  breakdown: BucketSummaryBreakdownRow[];
  series: BucketSummarySeriesPoint[];
  supportedBaselineCurrencies: string[];
};

export type PublicBucketMessage = {
  id: string;
  messageGuid?: string | null;
  senderName: string | null;
  body: string;
  createdAt: string;
  currency?: string | null;
  amount?: string | null;
  amountUnit?: string | null;
  appName?: string | null;
  appVersion?: string | null;
  senderGuid?: string | null;
  podcastIndexFeedId?: number | null;
  timePosition?: string | null;
  action?: MbrssV1ActionValue;
};
