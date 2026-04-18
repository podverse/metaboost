import 'server-only';

import type {
  Bucket,
  BucketBlockedSender,
  BucketMessage,
  BucketRoleItem,
  BucketSummaryData,
  BucketSummaryRangePreset,
} from '@metaboost/helpers-requests';

import { request, webBuckets } from '@metaboost/helpers-requests';

import { getCookieHeader, getServerApiBaseUrl } from './server-request';

/**
 * Server-side: fetch a single bucket by id. Returns null if not found or response invalid.
 */
export async function fetchBucket(id: string): Promise<{ bucket: Bucket | null }> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchBucket(baseUrl, id, cookieHeader);
  if (!res.ok || res.data === undefined) {
    return { bucket: null };
  }
  const bucket = res.data.bucket;
  if (bucket === undefined || typeof bucket?.id !== 'string') {
    return { bucket: null };
  }
  return { bucket };
}

/**
 * Server-side: fetch parent chain from root to immediate parent (root first). Returns [] for root bucket or on error.
 */
export async function fetchBucketAncestry(bucket: Bucket): Promise<Bucket[]> {
  if (bucket.parentBucketId === null) return [];
  const parents: Bucket[] = [];
  let parentId: string | null = bucket.parentBucketId;
  while (parentId !== null) {
    const { bucket: parent } = await fetchBucket(parentId);
    if (parent === null) break;
    parents.unshift(parent);
    parentId = parent.parentBucketId;
  }
  return parents;
}

/**
 * Server-side: fetch child buckets for a bucket. Returns [] on error or invalid response.
 */
export async function fetchChildBuckets(bucketId: string): Promise<Bucket[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchChildBuckets(baseUrl, bucketId, cookieHeader);
  if (!res.ok || res.data === undefined) {
    return [];
  }
  const data = res.data;
  return Array.isArray(data.buckets) ? data.buckets : [];
}

/**
 * Server-side: fetch messages for a bucket (authenticated). Returns [] on error or invalid response.
 * Uses first page only; for pagination use fetchMessagesPaginated.
 */
export async function fetchMessages(bucketId: string): Promise<BucketMessage[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchBucketMessages(baseUrl, bucketId, cookieHeader);
  if (!res.ok || res.data === undefined) {
    return [];
  }
  const data = res.data;
  return Array.isArray(data.messages) ? data.messages : [];
}

/**
 * Server-side: fetch dashboard bucket summary. Returns null on error or invalid response.
 */
export async function fetchDashboardBucketSummary(query?: {
  range?: BucketSummaryRangePreset;
  from?: string;
  to?: string;
  baselineCurrency?: string;
  includeBlockedSenderMessages?: boolean;
}): Promise<BucketSummaryData | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchDashboardBucketSummary(baseUrl, cookieHeader, query);
  if (!res.ok || res.data === undefined) {
    return null;
  }
  return res.data;
}

/**
 * Server-side: fetch bucket summary for a specific bucket. Returns null on error or invalid response.
 */
export async function fetchBucketSummary(
  bucketId: string,
  query?: {
    range?: BucketSummaryRangePreset;
    from?: string;
    to?: string;
    baselineCurrency?: string;
    includeBlockedSenderMessages?: boolean;
  }
): Promise<BucketSummaryData | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchBucketSummary(baseUrl, bucketId, cookieHeader, query);
  if (!res.ok || res.data === undefined) {
    return null;
  }
  return res.data;
}

export type FetchMessagesPaginatedResult = {
  messages: BucketMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Server-side: fetch a page of messages for a bucket. Returns pagination meta and messages.
 */
export async function fetchMessagesPaginated(
  bucketId: string,
  page: number,
  limit: number,
  sort?: 'recent' | 'oldest',
  includeBlockedSenderMessages?: boolean
): Promise<FetchMessagesPaginatedResult> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchBucketMessages(baseUrl, bucketId, cookieHeader, {
    page,
    limit,
    sort,
    ...(includeBlockedSenderMessages === true ? { includeBlockedSenderMessages: true } : {}),
  });
  if (!res.ok || res.data === undefined) {
    return {
      messages: [],
      page: 1,
      limit,
      total: 0,
      totalPages: 1,
    };
  }
  const data = res.data;
  const messages = Array.isArray(data.messages) ? data.messages : [];
  return {
    messages,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : limit,
    total: typeof data.total === 'number' ? data.total : 0,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
  };
}

export type BucketAdminRow = {
  id: string;
  bucketId: string;
  userId: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud?: number;
  createdAt: string;
  user: {
    id: string;
    shortId: string;
    email: string | null;
    username: string | null;
    displayName: string | null;
  } | null;
};

/**
 * Server-side: fetch bucket admins. Returns [] on error or invalid response.
 */
export async function fetchAdmins(bucketId: string): Promise<BucketAdminRow[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${bucketId}/admins`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined) {
    return [];
  }
  const data = res.data as { admins?: BucketAdminRow[] };
  const bucketAdmins = Array.isArray(data.admins) ? data.admins : [];
  return bucketAdmins;
}

export type BucketAdminInvitationRow = {
  id: string;
  token: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud?: number;
  status: string;
  expiresAt: string;
};

/**
 * Server-side: fetch pending admin invitations for a bucket. Returns [] on error or invalid response.
 */
export async function fetchPendingInvitations(
  bucketId: string
): Promise<BucketAdminInvitationRow[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${bucketId}/admin-invitations`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined) {
    return [];
  }
  const data = res.data as { invitations?: BucketAdminInvitationRow[] };
  return Array.isArray(data.invitations) ? data.invitations : [];
}

/**
 * Server-side: fetch bucket roles (predefined + custom). Returns [] on error or invalid response.
 */
export async function fetchBucketRoles(bucketId: string): Promise<BucketRoleItem[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqListBucketRoles(baseUrl, bucketId, cookieHeader);
  if (!res.ok || res.data === undefined) {
    return [];
  }
  const data = res.data;
  return Array.isArray(data.roles) ? data.roles : [];
}

/** Server-side: blocked senders for the bucket tree (API resolves root). */
export async function fetchBlockedSenders(bucketId: string): Promise<BucketBlockedSender[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchBlockedSenders(baseUrl, bucketId, cookieHeader);
  if (!res.ok || res.data === undefined) {
    return [];
  }
  return Array.isArray(res.data.blockedSenders) ? res.data.blockedSenders : [];
}
