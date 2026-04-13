'use client';

import type { BucketMessageListItem } from '@metaboost/ui';

import { useRouter } from 'next/navigation';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { managementWebBucketMessages } from '@metaboost/helpers-requests';
import { BucketMessageList, Pagination } from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../../../config/env';

export type BucketMessagesPanelProps = {
  bucketId: string;
  messages: BucketMessageListItem[];
  emptyMessage: string;
  page: number;
  totalPages: number;
  limit: number;
  basePath: string;
  /** Optional query params to include in pagination URLs (e.g. tab=messages, sort=oldest). */
  queryParams?: Record<string, string>;
};

export function BucketMessagesPanel({
  bucketId,
  messages,
  emptyMessage,
  page,
  totalPages,
  limit,
  basePath,
  queryParams,
}: BucketMessagesPanelProps) {
  const router = useRouter();
  const apiBaseUrl = getManagementApiBaseUrl();

  const handleDelete = async (messageId: string): Promise<void> => {
    const res = await managementWebBucketMessages.deleteBucketMessage(
      apiBaseUrl,
      bucketId,
      messageId
    );
    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <>
      <BucketMessageList
        messages={messages}
        variant="management"
        bucketId={bucketId}
        emptyMessage={emptyMessage}
        onDelete={handleDelete}
      />
      {totalPages > 1 ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={basePath}
          limit={limit}
          defaultLimit={DEFAULT_PAGE_LIMIT}
          queryParams={queryParams ?? { tab: 'messages' }}
        />
      ) : null}
    </>
  );
}
