'use client';

import type { ManagementBucketMessage } from '@metaboost/helpers-requests';
import type { BucketMessageListItem } from '@metaboost/ui';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getBucketDetailNavEntryFromCookie,
  getMessagesSortFromCookie,
  SectionWithHeading,
  useCookieModeListRefresh,
} from '@metaboost/ui';

import { fetchBucketMessagesPaginatedManagementClient } from '../../../../lib/client/fetchBucketMessagesPaginatedManagement';
import { BucketMessagesPanel } from './BucketMessagesPanel';
import { MessagesHeaderControls } from './MessagesHeaderControls';

function mapManagementMessagesToListItems(
  messages: ManagementBucketMessage[]
): BucketMessageListItem[] {
  return messages.map((m) => ({
    id: m.id,
    senderName: m.senderName,
    body: m.body,
    createdAt: m.createdAt,
    bucketId: m.bucketId,
    detailsSections: [],
  }));
}

export type BucketMessagesSectionClientProps = {
  bucketId: string;
  bucketPath: string;
  navCookieName: string;
  sortPrefsCookieName: string;
  /** False when SSR did not load messages (initial tab was Buckets). */
  serverMessagesWereLoaded: boolean;
  initialMessages: BucketMessageListItem[];
  initialPage: number;
  initialTotalPages: number;
  limit: number;
  initialSort: 'recent' | 'oldest';
  emptyMessage: string;
  messagesTitle: string;
  sortLabel: string;
  sortOptionLabels: { recent: string; oldest: string };
};

export function BucketMessagesSectionClient({
  bucketId,
  bucketPath,
  navCookieName,
  sortPrefsCookieName,
  serverMessagesWereLoaded,
  initialMessages,
  initialPage,
  initialTotalPages,
  limit,
  initialSort,
  emptyMessage,
  messagesTitle,
  sortLabel,
  sortOptionLabels,
}: BucketMessagesSectionClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [sort, setSort] = useState<'recent' | 'oldest'>(initialSort);
  const clientBootstrapDoneRef = useRef(false);

  useEffect(() => {
    setMessages(initialMessages);
    setPage(initialPage);
    setTotalPages(initialTotalPages);
    setSort(initialSort);
  }, [initialMessages, initialPage, initialSort, initialTotalPages]);

  const refetchFromCookies = useCallback(async () => {
    const nav = getBucketDetailNavEntryFromCookie(navCookieName, bucketPath);
    const messagesPage = Math.max(1, nav?.messagesPage ?? 1);
    const sortCookie = getMessagesSortFromCookie(sortPrefsCookieName);
    const sortResolved = sortCookie === 'oldest' ? 'oldest' : 'recent';
    const res = await fetchBucketMessagesPaginatedManagementClient(bucketId, {
      page: messagesPage,
      limit,
      sort: sortResolved,
    });
    setMessages(mapManagementMessagesToListItems(res.messages));
    setPage(res.page);
    setTotalPages(res.totalPages);
    setSort(sortResolved);
  }, [bucketId, bucketPath, limit, navCookieName, sortPrefsCookieName]);

  useEffect(() => {
    if (serverMessagesWereLoaded || clientBootstrapDoneRef.current) {
      return;
    }
    clientBootstrapDoneRef.current = true;
    void refetchFromCookies();
  }, [serverMessagesWereLoaded, refetchFromCookies]);

  const { afterCookieListMutation } = useCookieModeListRefresh(refetchFromCookies);

  return (
    <SectionWithHeading
      title={messagesTitle}
      headingAction={
        <MessagesHeaderControls
          sort={sort}
          label={sortLabel}
          sortOptionLabels={sortOptionLabels}
          sortPrefsCookieName={sortPrefsCookieName}
          onAfterCookieWrite={afterCookieListMutation}
        />
      }
    >
      <BucketMessagesPanel
        bucketId={bucketId}
        messages={messages}
        emptyMessage={emptyMessage}
        page={page}
        totalPages={totalPages}
        limit={limit}
        bucketPath={bucketPath}
        navCookieName={navCookieName}
        afterCookieListMutation={afterCookieListMutation}
        refetchMessages={refetchFromCookies}
      />
    </SectionWithHeading>
  );
}
