'use client';

import type { Bucket } from '@metaboost/helpers-requests';
import type { BucketMessageListItem } from '@metaboost/ui';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getBucketDetailNavEntryFromCookie,
  getMessagesSortFromCookie,
  SectionWithHeading,
  useCookieModeListRefresh,
} from '@metaboost/ui';

import { mapBucketMessagesToListItems } from '../../../../lib/bucketMessagesMapShared';
import { fetchBucketMessagesPaginatedClient } from '../../../../lib/client/fetchBucketMessagesPaginated';
import { TABLE_SORT_PREFS_COOKIE_NAME } from '../../../../lib/cookies';
import { BucketMessagesPanel } from './BucketMessagesPanel';
import { MessagesHeaderControls } from './MessagesHeaderControls';

export type BucketMessagesTabClientProps = {
  bucketId: string;
  viewedBucket: { id: string; type: Bucket['type'] };
  bucketPath: string;
  navCookieName: string;
  initialMessages: BucketMessageListItem[];
  initialPage: number;
  initialTotalPages: number;
  limit: number;
  initialSort: 'recent' | 'oldest';
  initialIncludeBlockedSenderMessages: boolean;
  emptyMessage: string;
  messagesTitle: string;
  sortLabel: string;
  sortOptionLabels: { recent: string; oldest: string };
  allowBlockSender?: boolean;
  /** When false, Messages was not SSR-loaded (initial tab was not Messages); fetch on mount. */
  serverMessagesWereLoaded?: boolean;
};

export function BucketMessagesTabClient({
  bucketId,
  viewedBucket,
  bucketPath,
  navCookieName,
  initialMessages,
  initialPage,
  initialTotalPages,
  limit,
  initialSort,
  initialIncludeBlockedSenderMessages,
  emptyMessage,
  messagesTitle,
  sortLabel,
  sortOptionLabels,
  allowBlockSender,
  serverMessagesWereLoaded = true,
}: BucketMessagesTabClientProps) {
  const t = useTranslations('buckets');
  const locale = useLocale();
  const [messages, setMessages] = useState(initialMessages);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [sort, setSort] = useState<'recent' | 'oldest'>(initialSort);
  const [includeBlocked, setIncludeBlocked] = useState(initialIncludeBlockedSenderMessages);
  const clientBootstrapDoneRef = useRef(false);

  useEffect(() => {
    setMessages(initialMessages);
    setPage(initialPage);
    setTotalPages(initialTotalPages);
    setSort(initialSort);
    setIncludeBlocked(initialIncludeBlockedSenderMessages);
  }, [
    initialMessages,
    initialPage,
    initialTotalPages,
    initialSort,
    initialIncludeBlockedSenderMessages,
  ]);

  const refetchFromCookies = useCallback(async () => {
    const nav = getBucketDetailNavEntryFromCookie(navCookieName, bucketPath);
    const messagesPage = Math.max(1, nav?.messagesPage ?? 1);
    const includeBlockedNav = nav?.includeBlockedSenderMessages === true;
    const sortCookie = getMessagesSortFromCookie(TABLE_SORT_PREFS_COOKIE_NAME);
    const sortResolved = sortCookie === 'oldest' ? 'oldest' : 'recent';
    const res = await fetchBucketMessagesPaginatedClient(bucketId, {
      page: messagesPage,
      limit,
      sort: sortResolved,
      includeBlockedSenderMessages: includeBlockedNav,
    });
    setMessages(mapBucketMessagesToListItems(res.messages, t, locale, viewedBucket));
    setPage(res.page);
    setTotalPages(res.totalPages);
    setSort(sortResolved);
    setIncludeBlocked(includeBlockedNav);
  }, [bucketId, bucketPath, limit, locale, navCookieName, t, viewedBucket]);

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
          bucketPath={bucketPath}
          navCookieName={navCookieName}
          includeBlockedSenderMessages={includeBlocked}
          label={sortLabel}
          sortOptionLabels={sortOptionLabels}
          sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
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
        allowBlockSender={allowBlockSender}
        onAfterCookieWrite={afterCookieListMutation}
      />
    </SectionWithHeading>
  );
}
