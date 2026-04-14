import type { ApiResponse } from '../request.js';

import { request } from '../request.js';

export type ManagementBucketMessage = {
  id: string;
  bucketId: string;
  senderName: string | null;
  body: string;
  isPublic: boolean;
  paymentVerifiedByApp?: boolean;
  paymentVerificationLevel?:
    | 'fully-verified'
    | 'verified-largest-recipient-succeeded'
    | 'partially-verified'
    | 'not-verified';
  paymentRecipientOutcomes?: Array<{
    type: string;
    address: string;
    split: number;
    name: string | null;
    custom_key: string | null;
    custom_value: string | null;
    fee: boolean;
    status: 'verified' | 'failed' | 'undetermined';
  }>;
  paymentRecipientVerifiedCount?: number;
  paymentRecipientFailedCount?: number;
  paymentRecipientUndeterminedCount?: number;
  createdAt: string;
};

export type ListBucketMessagesResponse = {
  messages: ManagementBucketMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function listBucketMessages(
  baseUrl: string,
  bucketId: string,
  params?: {
    page?: number;
    limit?: number;
    sort?: 'recent' | 'oldest';
    includePartiallyVerified?: boolean;
    includeUnverified?: boolean;
  },
  token?: string | null
): Promise<ApiResponse<ListBucketMessagesResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined && params.page > 1) {
    searchParams.set('page', String(params.page));
  }
  if (params?.limit !== undefined && params.limit > 0) {
    searchParams.set('limit', String(params.limit));
  }
  if (params?.sort === 'oldest') {
    searchParams.set('sort', 'oldest');
  }
  if (params?.includePartiallyVerified === true) {
    searchParams.set('includePartiallyVerified', '1');
  }
  if (params?.includeUnverified === true) {
    searchParams.set('includeUnverified', '1');
  }
  const query = searchParams.toString();
  const path =
    query !== '' ? `/buckets/${bucketId}/messages?${query}` : `/buckets/${bucketId}/messages`;
  return request<ListBucketMessagesResponse>(baseUrl, path, {
    token: token ?? undefined,
  });
}

export async function getBucketMessage(
  baseUrl: string,
  bucketId: string,
  messageId: string,
  token?: string | null
): Promise<ApiResponse<{ message: ManagementBucketMessage }>> {
  return request<{ message: ManagementBucketMessage }>(
    baseUrl,
    `/buckets/${bucketId}/messages/${messageId}`,
    { token: token ?? undefined }
  );
}

export async function deleteBucketMessage(
  baseUrl: string,
  bucketId: string,
  messageId: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/buckets/${bucketId}/messages/${messageId}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}
