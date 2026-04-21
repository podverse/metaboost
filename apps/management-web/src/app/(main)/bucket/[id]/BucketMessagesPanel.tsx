'use client';

import type { BucketMessageListItem } from '@metaboost/ui';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { managementWebBucketMessages } from '@metaboost/helpers-requests';
import { BucketMessageList, mergeBucketDetailNavInCookie, Pagination } from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../../../config/env';

export type BucketMessagesPanelProps = {
  bucketId: string;
  messages: BucketMessageListItem[];
  emptyMessage: string;
  page: number;
  totalPages: number;
  limit: number;
  bucketPath: string;
  navCookieName: string;
  afterCookieListMutation: () => Promise<void>;
  refetchMessages: () => Promise<void>;
};

export function BucketMessagesPanel({
  bucketId,
  messages,
  emptyMessage,
  page,
  totalPages,
  limit,
  bucketPath,
  navCookieName,
  afterCookieListMutation,
  refetchMessages,
}: BucketMessagesPanelProps) {
  const apiBaseUrl = getManagementApiBaseUrl();

  const handleDelete = async (messageId: string): Promise<void> => {
    const res = await managementWebBucketMessages.deleteBucketMessage(
      apiBaseUrl,
      bucketId,
      messageId
    );
    if (res.ok) {
      await refetchMessages();
    }
  };

  const refreshPagination = (nextPage: number) => {
    mergeBucketDetailNavInCookie(navCookieName, bucketPath, { messagesPage: nextPage });
    void afterCookieListMutation();
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
          basePath={bucketPath}
          limit={limit}
          defaultLimit={DEFAULT_PAGE_LIMIT}
          refreshOnPage={refreshPagination}
        />
      ) : null}
    </>
  );
}
