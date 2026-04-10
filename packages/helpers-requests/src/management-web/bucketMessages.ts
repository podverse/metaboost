import type { ApiResponse } from '../request.js';

import { request } from '../request.js';

export type ManagementBucketMessage = {
  id: string;
  bucketId: string;
  senderName: string;
  body: string;
  isPublic: boolean;
  createdAt: string;
};

export type CreateMessageBody = { senderName: string; body: string; isPublic?: boolean };
export type UpdateMessageBody = { body?: string; isPublic?: boolean };

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
  params?: { page?: number; limit?: number; sort?: 'recent' | 'oldest' },
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

export async function createBucketMessage(
  baseUrl: string,
  bucketId: string,
  body: CreateMessageBody,
  token?: string | null
): Promise<ApiResponse<{ message: ManagementBucketMessage }>> {
  return request<{ message: ManagementBucketMessage }>(baseUrl, `/buckets/${bucketId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function updateBucketMessage(
  baseUrl: string,
  bucketId: string,
  messageId: string,
  body: UpdateMessageBody,
  token?: string | null
): Promise<ApiResponse<{ message: ManagementBucketMessage }>> {
  return request<{ message: ManagementBucketMessage }>(
    baseUrl,
    `/buckets/${bucketId}/messages/${messageId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
      token: token ?? undefined,
    }
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
