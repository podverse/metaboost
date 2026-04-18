'use client';

import type { BucketMessageListItem } from '@metaboost/ui';

import { useRouter } from 'next/navigation';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { webBuckets } from '@metaboost/helpers-requests';
import { BucketMessageList, mergeBucketDetailNavInCookie, Pagination } from '@metaboost/ui';

import { getApiBaseUrl } from '../../../../lib/api-client';

export type BucketMessagesPanelProps = {
  bucketId: string;
  messages: BucketMessageListItem[];
  emptyMessage: string;
  page: number;
  totalPages: number;
  limit: number;
  bucketPath: string;
  navCookieName: string;
  /** When true, message menu includes Block sender when senderGuid is present (requires API permission). */
  allowBlockSender?: boolean;
  /** When set, pagination updates use async refresh instead of router.refresh. */
  onAfterCookieWrite?: () => Promise<void>;
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
  allowBlockSender = false,
  onAfterCookieWrite,
}: BucketMessagesPanelProps) {
  const router = useRouter();

  const handleDelete = async (messageId: string): Promise<void> => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/buckets/${bucketId}/messages/${messageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      router.refresh();
    }
  };

  const handleBlockSender = async (
    _messageId: string,
    senderGuid: string,
    labelSnapshot: string | null
  ): Promise<void> => {
    const baseUrl = getApiBaseUrl();
    const res = await webBuckets.reqPostBlockedSender(baseUrl, bucketId, {
      senderGuid,
      labelSnapshot,
    });
    if (res.ok) {
      router.refresh();
    }
  };

  const refreshPagination = (nextPage: number) => {
    mergeBucketDetailNavInCookie(navCookieName, bucketPath, { messagesPage: nextPage });
    void (onAfterCookieWrite !== undefined
      ? onAfterCookieWrite()
      : Promise.resolve(router.refresh()));
  };

  return (
    <>
      <BucketMessageList
        messages={messages}
        variant="management"
        bucketId={bucketId}
        emptyMessage={emptyMessage}
        onDelete={handleDelete}
        onBlockSender={allowBlockSender ? handleBlockSender : undefined}
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
