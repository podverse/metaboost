import type {
  BucketRoleItem,
  CustomBucketRoleItem,
  CreateBucketRoleBody,
  UpdateBucketRoleBody,
} from '../management-web/bucketRoles.js';
import type { ApiResponse } from '../request.js';
import type {
  Bucket,
  BucketMessage,
  PublicBucket,
  PublicBucketMessage,
  PublicSubmitMessageBody,
} from '../types/bucket-types.js';

import { request } from '../request.js';

const SERVER_OPTIONS = { cache: 'no-store' as RequestCache } as const;

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

/**
 * GET /buckets/:bucketId/buckets (authenticated). Returns child buckets.
 */
export async function reqFetchChildBuckets(
  baseUrl: string,
  bucketId: string,
  cookieHeader: string
): Promise<ApiResponse<{ buckets: Bucket[] }>> {
  return request<{ buckets: Bucket[] }>(baseUrl, `/buckets/${bucketId}/buckets`, {
    headers: { Cookie: cookieHeader },
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

/**
 * GET /buckets/:bucketId/messages (authenticated). List messages for a bucket with optional pagination and sort.
 */
export async function reqFetchBucketMessages(
  baseUrl: string,
  bucketId: string,
  cookieHeader: string,
  options?: { page?: number; limit?: number; sort?: 'recent' | 'oldest' }
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
  const query = params.toString();
  const url =
    query !== '' ? `/buckets/${bucketId}/messages?${query}` : `/buckets/${bucketId}/messages`;
  return request<BucketMessagesListResponse>(baseUrl, url, {
    headers: { Cookie: cookieHeader },
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
 * POST /buckets/public/:id/messages (unauthenticated). Submit a message to a public bucket.
 */
export async function reqPostPublicBucketMessage(
  baseUrl: string,
  bucketId: string,
  body: PublicSubmitMessageBody
): Promise<ApiResponse<{ message?: PublicBucketMessage }>> {
  return request<{ message?: PublicBucketMessage }>(
    baseUrl,
    `/buckets/public/${bucketId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      credentials: 'omit',
      ...SERVER_OPTIONS,
    }
  );
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
