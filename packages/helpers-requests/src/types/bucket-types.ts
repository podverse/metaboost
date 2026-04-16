/**
 * Bucket and related types for web bucket API responses.
 * Kept in sync with API response shapes (apps/api).
 */

import type { Mb1ActionValue } from '@metaboost/helpers';

export type Bucket = {
  id: string;
  shortId: string;
  ownerId: string;
  name: string;
  type: 'rss-network' | 'rss-channel' | 'rss-item';
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number;
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
  type: 'rss-network' | 'rss-channel' | 'rss-item';
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number;
  /** Parent chain from root to immediate parent (public parents only). */
  ancestors: PublicBucketAncestor[];
};

/** Authenticated GET /buckets/:id/messages list item. */
export type BucketMessageRecipientOutcomeStatus = 'verified' | 'failed' | 'undetermined';

export type BucketMessageRecipientOutcome = {
  type: string;
  address: string;
  split: number;
  name: string | null;
  custom_key: string | null;
  custom_value: string | null;
  fee: boolean;
  status: BucketMessageRecipientOutcomeStatus;
};

export type BucketMessageVerificationLevel =
  | 'fully-verified'
  | 'verified-largest-recipient-succeeded'
  | 'partially-verified'
  | 'not-verified';

export type BucketMessageSourceBucketSummary = {
  id: string;
  shortId: string;
  name: string;
  type: 'rss-network' | 'rss-channel' | 'rss-item';
};

export type BucketMessageSourceBucketContext = {
  bucket: BucketMessageSourceBucketSummary;
  parentBucket: BucketMessageSourceBucketSummary | null;
};

export type BucketMessage = {
  id: string;
  messageGuid?: string | null;
  bucketId: string;
  senderName: string | null;
  body: string;
  isPublic: boolean;
  createdAt: string;
  currency?: string | null;
  amount?: string | null;
  amountUnit?: string | null;
  appName?: string | null;
  appVersion?: string | null;
  senderId?: string | null;
  podcastIndexFeedId?: number | null;
  timePosition?: string | null;
  paymentVerifiedByApp?: boolean;
  paymentVerificationLevel?: BucketMessageVerificationLevel;
  paymentRecipientOutcomes?: BucketMessageRecipientOutcome[];
  paymentRecipientVerifiedCount?: number;
  paymentRecipientFailedCount?: number;
  paymentRecipientUndeterminedCount?: number;
  action?: Mb1ActionValue;
  sourceBucketContext?: BucketMessageSourceBucketContext;
};

export type PublicBucketMessage = {
  id: string;
  messageGuid?: string | null;
  senderName: string | null;
  body: string;
  isPublic: boolean;
  createdAt: string;
  currency?: string | null;
  amount?: string | null;
  amountUnit?: string | null;
  appName?: string | null;
  appVersion?: string | null;
  senderId?: string | null;
  podcastIndexFeedId?: number | null;
  timePosition?: string | null;
  paymentVerificationLevel?: BucketMessageVerificationLevel;
  action?: Mb1ActionValue;
};
