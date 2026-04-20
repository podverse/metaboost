'use client';

import type {
  ListBucketMessagesResponse,
  ManagementBucketMessage,
} from '@metaboost/helpers-requests';

import { request } from '@metaboost/helpers-requests';

import { getManagementApiBaseUrl } from '../../config/env';

export async function fetchBucketMessagesPaginatedManagementClient(
  bucketId: string,
  options: {
    page: number;
    limit: number;
    sort?: 'recent' | 'oldest';
  }
): Promise<{
  messages: ManagementBucketMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const params = new URLSearchParams();
  if (options.page > 1) {
    params.set('page', String(options.page));
  }
  if (options.limit > 0 && options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options.sort === 'oldest') {
    params.set('sort', 'oldest');
  }
  const query = params.toString();
  const path =
    query !== '' ? `/buckets/${bucketId}/messages?${query}` : `/buckets/${bucketId}/messages`;

  const res = await request<ListBucketMessagesResponse>(getManagementApiBaseUrl(), path, {});
  if (!res.ok || res.data === undefined) {
    return {
      messages: [],
      page: 1,
      limit: options.limit,
      total: 0,
      totalPages: 1,
    };
  }
  const data = res.data;
  const messages = Array.isArray(data.messages) ? data.messages : [];
  return {
    messages,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : options.limit,
    total: typeof data.total === 'number' ? data.total : 0,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
  };
}
