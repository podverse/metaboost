import type { ApiResponse, RequestOptions } from '../request.js';
import type { RegistryBucketAppPolicyItem } from '../types/bucket-types.js';

import { isAscDescSortOrder } from '@metaboost/helpers';

import { request } from '../request.js';

export type ManagementBucket = {
  id: string;
  idText: string;
  ownerId: string;
  /** Present on GET /buckets/:id; display name or "email" for owner. */
  ownerDisplayName?: string | null;
  name: string;
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number;
  preferredCurrency: string;
  publicBoostDisplayMinimumMinor: number;
  conversionEndpointUrl: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
};

export type ListBucketsData = {
  buckets: ManagementBucket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  truncatedTotal?: true;
};

/** Token optional; omit for cookie auth (credentials: 'include'). */
export async function listBuckets(
  baseUrl: string,
  params?: { page?: number; limit?: number; search?: string },
  token?: string | null
): Promise<ApiResponse<ListBucketsData>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set('page', String(params.page));
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params?.search !== undefined && params.search.trim() !== '')
    searchParams.set('search', params.search.trim());
  const query = searchParams.toString();
  const path = query !== '' ? `/buckets?${query}` : '/buckets';
  return request<ListBucketsData>(baseUrl, path, { token: token ?? undefined });
}

export async function getBucket(
  baseUrl: string,
  id: string,
  token?: string | null
): Promise<ApiResponse<{ bucket: ManagementBucket }>> {
  return request<{ bucket: ManagementBucket }>(baseUrl, `/buckets/${id}`, {
    token: token ?? undefined,
  });
}

/**
 * GET /buckets/:id/buckets — list child buckets for a parent bucket.
 * Use options.headers (e.g. Cookie) for server-side auth, or options.token for client.
 * Optional search, sortBy, sortOrder are forwarded as query params.
 */
export async function getChildBuckets(
  baseUrl: string,
  bucketId: string,
  options?: RequestOptions & {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<ApiResponse<{ buckets: ManagementBucket[] }>> {
  const params = new URLSearchParams();
  let reqOpts: RequestOptions = {};
  if (options !== undefined) {
    const { search, sortBy, sortOrder, ...rest } = options;
    if (search !== undefined && search.trim() !== '') {
      params.set('search', search.trim());
    }
    if (sortBy !== undefined && sortBy.trim() !== '') {
      params.set('sortBy', sortBy.trim());
    }
    if (sortOrder !== undefined && isAscDescSortOrder(sortOrder)) {
      params.set('sortOrder', sortOrder);
    }
    reqOpts = rest;
  }
  const qs = params.toString();
  const path = qs !== '' ? `/buckets/${bucketId}/buckets?${qs}` : `/buckets/${bucketId}/buckets`;
  return request<{ buckets: ManagementBucket[] }>(baseUrl, path, reqOpts);
}

export type CreateBucketBody = { name: string; isPublic?: boolean; ownerId: string };
export type UpdateBucketBody = {
  name?: string;
  isPublic?: boolean;
  messageBodyMaxLength?: number;
  preferredCurrency?: string;
  publicBoostDisplayMinimumMinor?: number;
  applyToDescendants?: boolean;
};

export type CreateChildBucketBody = { name: string; isPublic?: boolean };

export async function createBucket(
  baseUrl: string,
  body: CreateBucketBody,
  token?: string | null
): Promise<ApiResponse<{ bucket: ManagementBucket }>> {
  return request<{ bucket: ManagementBucket }>(baseUrl, '/buckets', {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function createChildBucket(
  baseUrl: string,
  parentId: string,
  body: CreateChildBucketBody,
  options?: RequestOptions
): Promise<ApiResponse<{ bucket: ManagementBucket }>> {
  return request<{ bucket: ManagementBucket }>(baseUrl, `/buckets/${parentId}/buckets`, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
}

export async function updateBucket(
  baseUrl: string,
  id: string,
  body: UpdateBucketBody,
  token?: string | null
): Promise<ApiResponse<{ bucket: ManagementBucket }>> {
  return request<{ bucket: ManagementBucket }>(baseUrl, `/buckets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function deleteBucket(
  baseUrl: string,
  id: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/buckets/${id}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}

/**
 * GET /buckets/:bucketId/registry-apps — registry apps with per-bucket and global block policy (management API).
 */
export async function getRegistryAppPolicyForManagementBucket(
  baseUrl: string,
  bucketId: string,
  options?: RequestOptions
): Promise<ApiResponse<{ apps: RegistryBucketAppPolicyItem[] }>> {
  return request<{ apps: RegistryBucketAppPolicyItem[] }>(
    baseUrl,
    `/buckets/${encodeURIComponent(bucketId)}/registry-apps`,
    { cache: 'no-store', ...options }
  );
}

export async function addManagementBucketBlockedApp(
  baseUrl: string,
  bucketId: string,
  body: { appId: string; appNameSnapshot?: string | null },
  options?: RequestOptions
): Promise<
  ApiResponse<{
    blockedApp: {
      id: string;
      rootBucketId: string;
      appId: string;
      appNameSnapshot: string | null;
      createdAt: string;
    };
  }>
> {
  return request(baseUrl, `/buckets/${encodeURIComponent(bucketId)}/blocked-apps`, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
}

export async function removeManagementBucketBlockedApp(
  baseUrl: string,
  bucketId: string,
  blockedAppRowId: string,
  options?: RequestOptions
): Promise<ApiResponse<void>> {
  return request<void>(
    baseUrl,
    `/buckets/${encodeURIComponent(bucketId)}/blocked-apps/${encodeURIComponent(blockedAppRowId)}`,
    { method: 'DELETE', ...options }
  );
}
