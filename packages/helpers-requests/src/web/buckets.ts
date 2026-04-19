import type {
  BucketRoleItem,
  CustomBucketRoleItem,
  CreateBucketRoleBody,
  UpdateBucketRoleBody,
} from '../management-web/bucketRoles.js';
import type { ApiResponse } from '../request.js';
import type {
  Bucket,
  BucketBlockedApp,
  BucketBlockedSender,
  BucketMessage,
  BucketSummaryData,
  BucketSummaryRangePreset,
  PublicBucket,
  PublicBucketMessage,
  RegistryBucketAppPolicyItem,
} from '../types/bucket-types.js';

import { isAscDescSortOrder } from '@metaboost/helpers';

import { request } from '../request.js';

const SERVER_OPTIONS = { cache: 'no-store' as RequestCache } as const;

export type CreateBucketBody =
  | { type: 'rss-network'; name: string; isPublic?: boolean }
  | { type: 'rss-channel'; rssFeedUrl: string; isPublic?: boolean }
  | { type: 'mb-root'; name: string; isPublic?: boolean };

export type CreateChildBucketBody =
  | { type: 'rss-channel'; rssFeedUrl: string; isPublic?: boolean }
  | { type: 'mb-mid'; name: string; isPublic?: boolean }
  | { type: 'mb-leaf'; name: string; isPublic?: boolean };

export type UpdateBucketBody = {
  name?: string;
  isPublic?: boolean;
  messageBodyMaxLength?: number;
  minimumMessageUsdCents?: number;
  applyToDescendants?: boolean;
};

/**
 * GET /buckets/:id (authenticated). Use for server-side fetch with cookie.
 * API returns { bucket }.
 */
export async function reqFetchBucket(
  baseUrl: string,
  bucketId: string,
  cookieHeader: string
): Promise<ApiResponse<{ bucket: Bucket }>> {
  return request<{ bucket: Bucket }>(baseUrl, `/buckets/${bucketId}`, {
    headers: { Cookie: cookieHeader },
    ...SERVER_OPTIONS,
  });
}

export type ListTopLevelBucketsQuery = {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/**
 * GET /buckets (authenticated). Top-level accessible buckets; optional search and sort.
 */
export async function reqFetchBucketsList(
  baseUrl: string,
  cookieHeader: string | undefined,
  query?: ListTopLevelBucketsQuery
): Promise<ApiResponse<{ buckets: Bucket[] }>> {
  const params = new URLSearchParams();
  if (query?.search !== undefined && query.search.trim() !== '') {
    params.set('search', query.search.trim());
  }
  if (query?.sortBy !== undefined && query.sortBy.trim() !== '') {
    params.set('sortBy', query.sortBy.trim());
  }
  if (query?.sortOrder !== undefined && isAscDescSortOrder(query.sortOrder)) {
    params.set('sortOrder', query.sortOrder);
  }
  const qs = params.toString();
  const path = qs !== '' ? `/buckets?${qs}` : '/buckets';
  return request<{ buckets: Bucket[] }>(baseUrl, path, {
    ...(cookieHeader !== undefined && cookieHeader !== ''
      ? { headers: { Cookie: cookieHeader } }
      : {}),
    ...SERVER_OPTIONS,
  });
}

export type ListChildBucketsQuery = {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/**
 * GET /buckets/:bucketId/buckets (authenticated). Returns child buckets with optional sort/search.
 */
export async function reqFetchChildBuckets(
  baseUrl: string,
  bucketId: string,
  cookieHeader: string | undefined,
  query?: ListChildBucketsQuery
): Promise<ApiResponse<{ buckets: Bucket[] }>> {
  const params = new URLSearchParams();
  if (query?.search !== undefined && query.search.trim() !== '') {
    params.set('search', query.search.trim());
  }
  if (query?.sortBy !== undefined && query.sortBy.trim() !== '') {
    params.set('sortBy', query.sortBy.trim());
  }
  if (query?.sortOrder !== undefined && isAscDescSortOrder(query.sortOrder)) {
    params.set('sortOrder', query.sortOrder);
  }
  const qs = params.toString();
  const path = qs !== '' ? `/buckets/${bucketId}/buckets?${qs}` : `/buckets/${bucketId}/buckets`;
  return request<{ buckets: Bucket[] }>(baseUrl, path, {
    ...(cookieHeader !== undefined && cookieHeader !== ''
      ? { headers: { Cookie: cookieHeader } }
      : {}),
    ...SERVER_OPTIONS,
  });
}

/**
 * POST /buckets (authenticated). Create top-level bucket.
 */
export async function reqPostCreateBucket(
  baseUrl: string,
  body: CreateBucketBody,
  cookieHeader?: string
): Promise<ApiResponse<{ bucket: Bucket }>> {
  return request<{ bucket: Bucket }>(baseUrl, '/buckets', {
    method: 'POST',
    body: JSON.stringify(body),
    ...(cookieHeader !== undefined && cookieHeader !== ''
      ? { headers: { Cookie: cookieHeader } }
      : {}),
    ...SERVER_OPTIONS,
  });
}

/**
 * POST /buckets/:bucketId/buckets (authenticated). Create child bucket.
 */
export async function reqPostCreateChildBucket(
  baseUrl: string,
  bucketId: string,
  body: CreateChildBucketBody,
  cookieHeader?: string
): Promise<ApiResponse<{ bucket: Bucket }>> {
  return request<{ bucket: Bucket }>(baseUrl, `/buckets/${bucketId}/buckets`, {
    method: 'POST',
    body: JSON.stringify(body),
    ...(cookieHeader !== undefined && cookieHeader !== ''
      ? { headers: { Cookie: cookieHeader } }
      : {}),
    ...SERVER_OPTIONS,
  });
}

export async function reqPatchUpdateBucket(
  baseUrl: string,
  bucketId: string,
  body: UpdateBucketBody,
  cookieHeader?: string
): Promise<ApiResponse<{ bucket: Bucket }>> {
  return request<{ bucket: Bucket }>(baseUrl, `/buckets/${bucketId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...(cookieHeader !== undefined && cookieHeader !== ''
      ? { headers: { Cookie: cookieHeader } }
      : {}),
    ...SERVER_OPTIONS,
  });
}

export type BucketMessagesListResponse = {
  messages?: BucketMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BucketSummaryQuery = {
  range?: BucketSummaryRangePreset;
  from?: string;
  to?: string;
  baselineCurrency?: string;
  /** When true, summary counts include messages from blocked senders. */
  includeBlockedSenderMessages?: boolean;
};

function buildBucketSummaryPath(pathname: string, query?: BucketSummaryQuery): string {
  const params = new URLSearchParams();
  if (query?.range !== undefined) params.set('range', query.range);
  if (query?.from !== undefined && query.from.trim() !== '') params.set('from', query.from);
  if (query?.to !== undefined && query.to.trim() !== '') params.set('to', query.to);
  if (query?.baselineCurrency !== undefined && query.baselineCurrency.trim() !== '') {
    params.set('baselineCurrency', query.baselineCurrency.trim());
  }
  if (query?.includeBlockedSenderMessages === true) {
    params.set('includeBlockedSenderMessages', 'true');
  }
  const queryString = params.toString();
  return queryString !== '' ? `${pathname}?${queryString}` : pathname;
}

export async function reqFetchDashboardBucketSummary(
  baseUrl: string,
  cookieHeader?: string,
  query?: BucketSummaryQuery
): Promise<ApiResponse<BucketSummaryData>> {
  return request<BucketSummaryData>(baseUrl, buildBucketSummaryPath('/buckets/summary', query), {
    ...(cookieHeader !== undefined && cookieHeader !== ''
      ? { headers: { Cookie: cookieHeader } }
      : {}),
    ...SERVER_OPTIONS,
  });
}

export async function reqFetchBucketSummary(
  baseUrl: string,
  bucketId: string,
  cookieHeader?: string,
  query?: BucketSummaryQuery
): Promise<ApiResponse<BucketSummaryData>> {
  return request<BucketSummaryData>(
    baseUrl,
    buildBucketSummaryPath(`/buckets/${bucketId}/summary`, query),
    {
      ...(cookieHeader !== undefined && cookieHeader !== ''
        ? { headers: { Cookie: cookieHeader } }
        : {}),
      ...SERVER_OPTIONS,
    }
  );
}

/**
 * GET /buckets/:bucketId/messages (authenticated). List messages for a bucket with optional pagination and sort.
 */
/**
 * GET /buckets/:bucketId/blocked-senders (authenticated). List blocked sender GUIDs for the tree root.
 */
export async function reqFetchBlockedSenders(
  baseUrl: string,
  bucketId: string,
  cookieHeader: string,
  options?: { q?: string }
): Promise<ApiResponse<{ blockedSenders: BucketBlockedSender[] }>> {
  const params = new URLSearchParams();
  if (options?.q !== undefined && options.q.trim() !== '') {
    params.set('q', options.q.trim());
  }
  const qs = params.toString();
  const url =
    qs !== ''
      ? `/buckets/${bucketId}/blocked-senders?${qs}`
      : `/buckets/${bucketId}/blocked-senders`;
  return request<{ blockedSenders: BucketBlockedSender[] }>(baseUrl, url, {
    headers: { Cookie: cookieHeader },
    ...SERVER_OPTIONS,
  });
}

/**
 * GET /buckets/:bucketId/registry-apps (authenticated). List registry apps with bucket/global block state.
 */
export async function reqFetchRegistryAppsForBucket(
  baseUrl: string,
  bucketId: string,
  cookieHeader: string
): Promise<ApiResponse<{ apps: RegistryBucketAppPolicyItem[] }>> {
  return request<{ apps: RegistryBucketAppPolicyItem[] }>(
    baseUrl,
    `/buckets/${bucketId}/registry-apps`,
    {
      headers: { Cookie: cookieHeader },
      ...SERVER_OPTIONS,
    }
  );
}

/**
 * GET /buckets/:bucketId/blocked-apps (authenticated). List blocked apps for the tree root.
 */
export async function reqFetchBlockedApps(
  baseUrl: string,
  bucketId: string,
  cookieHeader: string,
  options?: { q?: string }
): Promise<ApiResponse<{ blockedApps: BucketBlockedApp[] }>> {
  const params = new URLSearchParams();
  if (options?.q !== undefined && options.q.trim() !== '') {
    params.set('q', options.q.trim());
  }
  const qs = params.toString();
  const url =
    qs !== '' ? `/buckets/${bucketId}/blocked-apps?${qs}` : `/buckets/${bucketId}/blocked-apps`;
  return request<{ blockedApps: BucketBlockedApp[] }>(baseUrl, url, {
    headers: { Cookie: cookieHeader },
    ...SERVER_OPTIONS,
  });
}

/**
 * POST /buckets/:bucketId/blocked-apps (authenticated).
 */
export async function reqPostBlockedApp(
  baseUrl: string,
  bucketId: string,
  body: { appId: string; appNameSnapshot?: string | null }
): Promise<ApiResponse<{ blockedApp: BucketBlockedApp }>> {
  return request<{ blockedApp: BucketBlockedApp }>(baseUrl, `/buckets/${bucketId}/blocked-apps`, {
    method: 'POST',
    body: JSON.stringify(body),
    ...SERVER_OPTIONS,
  });
}

/**
 * DELETE /buckets/:bucketId/blocked-apps/:blockedAppId (authenticated).
 */
export async function reqDeleteBlockedApp(
  baseUrl: string,
  bucketId: string,
  blockedAppId: string
): Promise<ApiResponse<unknown>> {
  return request(baseUrl, `/buckets/${bucketId}/blocked-apps/${blockedAppId}`, {
    method: 'DELETE',
    ...SERVER_OPTIONS,
  });
}

/**
 * POST /buckets/:bucketId/blocked-senders (authenticated).
 */
export async function reqPostBlockedSender(
  baseUrl: string,
  bucketId: string,
  body: { senderGuid: string; labelSnapshot?: string | null }
): Promise<ApiResponse<{ blockedSender: BucketBlockedSender }>> {
  return request<{ blockedSender: BucketBlockedSender }>(
    baseUrl,
    `/buckets/${bucketId}/blocked-senders`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      credentials: 'include',
    }
  );
}

/**
 * DELETE /buckets/:bucketId/blocked-senders/:blockedSenderId (authenticated).
 */
export async function reqDeleteBlockedSender(
  baseUrl: string,
  bucketId: string,
  blockedSenderId: string
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/buckets/${bucketId}/blocked-senders/${blockedSenderId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

export async function reqFetchBucketMessages(
  baseUrl: string,
  bucketId: string,
  cookieHeader: string,
  options?: {
    page?: number;
    limit?: number;
    sort?: 'recent' | 'oldest';
    includeBlockedSenderMessages?: boolean;
  }
): Promise<ApiResponse<BucketMessagesListResponse>> {
  const params = new URLSearchParams();
  if (options?.page !== undefined && options.page > 1) {
    params.set('page', String(options.page));
  }
  if (options?.limit !== undefined && options.limit > 0) {
    params.set('limit', String(options.limit));
  }
  if (options?.sort === 'oldest') {
    params.set('sort', 'oldest');
  }
  if (options?.includeBlockedSenderMessages === true) {
    params.set('includeBlockedSenderMessages', 'true');
  }
  const query = params.toString();
  const url =
    query !== '' ? `/buckets/${bucketId}/messages?${query}` : `/buckets/${bucketId}/messages`;
  return request<BucketMessagesListResponse>(baseUrl, url, {
    headers: { Cookie: cookieHeader },
    ...SERVER_OPTIONS,
  });
}

export type VerifyRssChannelResponse = {
  verified: true;
  parsedPodcastGuid: string;
  parsedChannelTitle: string;
  sync: {
    totalFeedItemsWithGuid: number;
    activeItemBuckets: number;
    createdItemBuckets: number;
    updatedItemBuckets: number;
    orphanedItemBuckets: number;
    restoredItemBuckets: number;
  };
};

/**
 * POST /buckets/:bucketId/rss/verify (authenticated). Verify RSS metaBoost tag and sync item buckets.
 */
export async function reqPostVerifyRssChannel(
  baseUrl: string,
  bucketId: string,
  cookieHeader?: string
): Promise<ApiResponse<VerifyRssChannelResponse>> {
  return request<VerifyRssChannelResponse>(baseUrl, `/buckets/${bucketId}/rss/verify`, {
    method: 'POST',
    ...(cookieHeader !== undefined && cookieHeader !== ''
      ? { headers: { Cookie: cookieHeader } }
      : {}),
    ...SERVER_OPTIONS,
  });
}

/**
 * GET /buckets/public/:id (unauthenticated). Public bucket by slug or id.
 */
export async function reqFetchPublicBucket(
  baseUrl: string,
  bucketId: string
): Promise<ApiResponse<{ bucket?: PublicBucket }>> {
  return request<{ bucket?: PublicBucket }>(baseUrl, `/buckets/public/${bucketId}`, {
    ...SERVER_OPTIONS,
  });
}

export type PublicBucketMessagesListResponse = {
  messages?: PublicBucketMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * GET /buckets/public/:id/messages (unauthenticated). Public messages for a bucket with optional pagination and sort.
 */
export async function reqFetchPublicBucketMessages(
  baseUrl: string,
  bucketId: string,
  options?: { page?: number; limit?: number; sort?: 'recent' | 'oldest' }
): Promise<ApiResponse<PublicBucketMessagesListResponse>> {
  const params = new URLSearchParams();
  if (options?.page !== undefined && options.page > 1) {
    params.set('page', String(options.page));
  }
  if (options?.limit !== undefined && options.limit > 0) {
    params.set('limit', String(options.limit));
  }
  if (options?.sort === 'oldest') {
    params.set('sort', 'oldest');
  }
  const query = params.toString();
  const url =
    query !== ''
      ? `/buckets/public/${bucketId}/messages?${query}`
      : `/buckets/public/${bucketId}/messages`;
  return request<PublicBucketMessagesListResponse>(baseUrl, url, {
    ...SERVER_OPTIONS,
  });
}

/**
 * DELETE /buckets/:id (authenticated). Deletes a bucket. Use from client with credentials.
 */
export async function reqDeleteBucket(
  baseUrl: string,
  bucketId: string,
  cookieHeader?: string
): Promise<ApiResponse<void>> {
  const options: { method: string; headers?: { Cookie: string }; cache?: RequestCache } = {
    method: 'DELETE',
    ...SERVER_OPTIONS,
  };
  if (cookieHeader !== undefined && cookieHeader !== '') {
    options.headers = { Cookie: cookieHeader };
  }
  const res = await request<void>(baseUrl, `/buckets/${bucketId}`, options);
  return res;
}

/**
 * GET /buckets/:bucketId/roles (authenticated). List predefined and custom roles. Owner or admin with update can access.
 */
export async function reqListBucketRoles(
  baseUrl: string,
  bucketId: string,
  cookieHeader: string
): Promise<ApiResponse<{ roles: BucketRoleItem[] }>> {
  return request<{ roles: BucketRoleItem[] }>(baseUrl, `/buckets/${bucketId}/roles`, {
    headers: { Cookie: cookieHeader },
    ...SERVER_OPTIONS,
  });
}

/**
 * POST /buckets/:bucketId/roles (authenticated). Create custom role.
 */
export async function reqCreateBucketRole(
  baseUrl: string,
  bucketId: string,
  body: CreateBucketRoleBody,
  cookieHeader: string
): Promise<ApiResponse<{ role: CustomBucketRoleItem }>> {
  return request<{ role: CustomBucketRoleItem }>(baseUrl, `/buckets/${bucketId}/roles`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Cookie: cookieHeader },
    ...SERVER_OPTIONS,
  });
}

/**
 * PATCH /buckets/:bucketId/roles/:roleId (authenticated). Update custom role.
 */
export async function reqUpdateBucketRole(
  baseUrl: string,
  bucketId: string,
  roleId: string,
  body: UpdateBucketRoleBody,
  cookieHeader: string
): Promise<ApiResponse<{ role: CustomBucketRoleItem }>> {
  return request<{ role: CustomBucketRoleItem }>(baseUrl, `/buckets/${bucketId}/roles/${roleId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { Cookie: cookieHeader },
    ...SERVER_OPTIONS,
  });
}

/**
 * DELETE /buckets/:bucketId/roles/:roleId (authenticated). Delete custom role.
 */
export async function reqDeleteBucketRole(
  baseUrl: string,
  bucketId: string,
  roleId: string,
  cookieHeader: string
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/buckets/${bucketId}/roles/${roleId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader },
    ...SERVER_OPTIONS,
  });
}
