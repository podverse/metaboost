import type { Bucket } from '@metaboost/helpers-requests';
import type { BreadcrumbItem } from '@metaboost/ui';

import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';

import { DEFAULT_PAGE_LIMIT, isTruthyQueryFlag } from '@metaboost/helpers';
import { formatDateTimeReadable } from '@metaboost/helpers-i18n/client';
import {
  BUCKET_DETAIL_BUCKETS_LIST_KEY,
  Breadcrumbs,
  BucketDetailPageLayout,
  getBucketDetailNavEntryFromCookieValue,
  getMessagesSortFromCookieValue,
  getSortPrefsFromCookieValue,
  Link,
  Row,
  SectionWithHeading,
  Stack,
  Table,
  Text,
} from '@metaboost/ui';

import { BucketSummaryPanel } from '../../../../components/BucketSummaryPanel';
import { canCreateChildBuckets, canDeleteBucketMessages } from '../../../../lib/bucket-authz';
import { mapBucketMessagesToListItems } from '../../../../lib/bucketMessagesMapShared';
import {
  fetchBucket,
  fetchBucketAncestry,
  fetchBucketSummary,
  fetchChildBuckets,
  fetchMessagesPaginated,
} from '../../../../lib/buckets';
import {
  buildInitialBucketSummaryApiQuery,
  resolveInitialBucketSummaryPrefBucketDetail,
} from '../../../../lib/bucketSummaryPrefs';
import {
  BUCKET_DETAIL_NAV_COOKIE_NAME,
  BUCKET_SUMMARY_PREFS_COOKIE_NAME,
  TABLE_SORT_PREFS_COOKIE_NAME,
} from '../../../../lib/cookies';
import {
  ROUTES,
  bucketDetailRoute,
  bucketNewRouteFromAncestry,
  bucketSettingsRoute,
} from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';
import { AddToRssPanel } from './AddToRssPanel';
import { AddToRssTabLink } from './AddToRssTabLink';
import { BucketDetailTabShell } from './BucketDetailTabShell';
import { BucketMessagesTabClient } from './BucketMessagesTabClient';
import { EndpointPanel } from './EndpointPanel';

type BucketSearchParams = {
  tab?: string;
  page?: string;
  sort?: string;
  sortBy?: string;
  sortOrder?: string;
  includeBlockedSenderMessages?: string;
  /** When "1", do not redirect an empty RSS Network to Add RSS channel (e.g. return from cancel on /new). */
  skipEmptyRssNetworkRedirect?: string;
};

function BreadcrumbLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

const BUCKETS_DEFAULT_SORT_BY = 'name';

function sortChildBuckets<
  T extends { name: string; lastMessageAt?: string | null; createdAt: string },
>(buckets: T[], sortBy: string, sortOrder: 'asc' | 'desc'): T[] {
  const sorted = [...buckets];
  const dir = sortOrder === 'asc' ? 1 : -1;
  sorted.sort((a, b) => {
    if (sortBy === 'name') {
      return dir * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'lastMessage') {
      const aVal = a.lastMessageAt ?? '';
      const bVal = b.lastMessageAt ?? '';
      if (aVal === '' && bVal === '') return 0;
      if (aVal === '') return 1;
      if (bVal === '') return -1;
      return dir * (aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
    }
    if (sortBy === 'created') {
      return dir * (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0);
    }
    return 0;
  });
  return sorted;
}

function sortRssItemBucketsByPubDateDesc(
  buckets: Array<Bucket & { rssItem?: { rssItemPubDate: string; orphaned: boolean } | null }>
): Array<Bucket & { rssItem?: { rssItemPubDate: string; orphaned: boolean } | null }> {
  return [...buckets].sort((a, b) => {
    const aDate = a.rssItem?.rssItemPubDate ?? '';
    const bDate = b.rssItem?.rssItemPubDate ?? '';
    if (aDate === '' && bDate === '') return 0;
    if (aDate === '') return 1;
    if (bDate === '') return -1;
    return aDate < bDate ? 1 : aDate > bDate ? -1 : 0;
  });
}

export default async function BucketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<BucketSearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const cookieStore = await cookies();
  const bucketSummaryPathKey = bucketDetailRoute(id);
  const navEntry = getBucketDetailNavEntryFromCookieValue(
    cookieStore.get(BUCKET_DETAIL_NAV_COOKIE_NAME)?.value,
    bucketSummaryPathKey
  );

  const page =
    resolvedSearchParams.page !== undefined
      ? Math.max(1, parseInt(resolvedSearchParams.page, 10) || 1)
      : Math.max(1, navEntry?.messagesPage ?? 1);

  const rawTabParam = resolvedSearchParams.tab;
  const tabForQuery =
    rawTabParam === 'buckets' ? 'buckets' : rawTabParam === 'endpoint' ? 'endpoint' : 'messages';
  const bucketSummaryInitialPref = resolveInitialBucketSummaryPrefBucketDetail(
    cookieStore.get(BUCKET_SUMMARY_PREFS_COOKIE_NAME)?.value,
    bucketSummaryPathKey
  );
  const bucketSummaryInitialQuery = buildInitialBucketSummaryApiQuery(
    bucketSummaryInitialPref,
    user.preferredCurrency ?? undefined
  );
  const sortPrefsCookieValue = cookieStore.get(TABLE_SORT_PREFS_COOKIE_NAME)?.value;

  const sort =
    resolvedSearchParams.sort !== undefined
      ? resolvedSearchParams.sort === 'oldest'
        ? 'oldest'
        : 'recent'
      : (getMessagesSortFromCookieValue(sortPrefsCookieValue) ?? 'recent');

  const includeBlockedSenderMessages =
    resolvedSearchParams.includeBlockedSenderMessages !== undefined
      ? isTruthyQueryFlag(resolvedSearchParams.includeBlockedSenderMessages)
      : navEntry?.includeBlockedSenderMessages === true;

  const bucketsSortBy =
    tabForQuery === 'buckets'
      ? resolvedSearchParams.sortBy === 'name' ||
        resolvedSearchParams.sortBy === 'lastMessage' ||
        resolvedSearchParams.sortBy === 'created'
        ? resolvedSearchParams.sortBy
        : (getSortPrefsFromCookieValue(sortPrefsCookieValue, BUCKET_DETAIL_BUCKETS_LIST_KEY)
            ?.sortBy ?? BUCKETS_DEFAULT_SORT_BY)
      : undefined;
  const bucketsSortOrder =
    tabForQuery === 'buckets'
      ? resolvedSearchParams.sortOrder === 'desc' || resolvedSearchParams.sortOrder === 'asc'
        ? resolvedSearchParams.sortOrder
        : (getSortPrefsFromCookieValue(sortPrefsCookieValue, BUCKET_DETAIL_BUCKETS_LIST_KEY)
            ?.sortOrder ?? 'asc')
      : undefined;

  const { bucket } = await fetchBucket(id);
  if (bucket === null) {
    notFound();
  }
  const tab =
    rawTabParam === 'buckets'
      ? 'buckets'
      : rawTabParam === 'add-to-rss' && bucket.type === 'rss-channel'
        ? 'add-to-rss'
        : rawTabParam === 'endpoint' &&
            (bucket.type === 'mb-root' || bucket.type === 'mb-mid' || bucket.type === 'mb-leaf')
          ? 'endpoint'
          : 'messages';

  const [childBuckets, ancestors, messagesResult, initialSummary] = await Promise.all([
    fetchChildBuckets(id),
    fetchBucketAncestry(bucket),
    tabForQuery === 'messages'
      ? fetchMessagesPaginated(id, page, DEFAULT_PAGE_LIMIT, sort, includeBlockedSenderMessages)
      : Promise.resolve({
          messages: [],
          page: 1,
          limit: DEFAULT_PAGE_LIMIT,
          total: 0,
          totalPages: 1,
        }),
    fetchBucketSummary(id, bucketSummaryInitialQuery),
  ]);

  const skipEmptyRssNetworkRedirect = isTruthyQueryFlag(
    resolvedSearchParams.skipEmptyRssNetworkRedirect
  );
  const hasRssChannelChild = childBuckets.some((c) => c.type === 'rss-channel');
  if (
    bucket.type === 'rss-network' &&
    (tab === 'messages' || tab === 'buckets') &&
    !skipEmptyRssNetworkRedirect &&
    !hasRssChannelChild &&
    (await canCreateChildBuckets(bucket.id, bucket.ownerId, user))
  ) {
    redirect(bucketNewRouteFromAncestry([id]));
  }

  const t = await getTranslations('buckets');
  const locale = await getLocale();
  const canDeleteMessages = await canDeleteBucketMessages(bucket.id, bucket.ownerId, user);
  const rssGuidValue =
    bucket.type === 'rss-item'
      ? (bucket.rssItem?.rssItemGuid ?? t('notAvailable'))
      : bucket.type === 'rss-channel'
        ? (bucket.rss?.rssPodcastGuid ?? t('notAvailable'))
        : null;
  const rssItemPubDateValue =
    bucket.type === 'rss-item'
      ? bucket.rssItem?.rssItemPubDate !== undefined
        ? formatDateTimeReadable(locale, bucket.rssItem.rssItemPubDate)
        : t('notAvailable')
      : null;
  const detailItems = [
    ...(rssItemPubDateValue !== null
      ? [{ label: t('rssItemPubDate'), value: rssItemPubDateValue }]
      : []),
    ...(rssGuidValue !== null ? [{ label: t('guid'), value: rssGuidValue }] : []),
  ];

  const sortedChildBuckets =
    tab === 'buckets' && bucket.type === 'rss-channel'
      ? sortRssItemBucketsByPubDateDesc(childBuckets)
      : tab === 'buckets' && bucketsSortBy !== undefined && bucketsSortOrder !== undefined
        ? sortChildBuckets(childBuckets, bucketsSortBy, bucketsSortOrder)
        : childBuckets;
  const childBucketsForContent = sortedChildBuckets.map((childBucket) => ({
    id: childBucket.id,
    name: childBucket.name,
    href: bucketDetailRoute(childBucket.shortId),
    createdAtDisplay: formatDateTimeReadable(locale, childBucket.createdAt),
    lastMessageAtDisplay:
      childBucket.lastMessageAt !== undefined && childBucket.lastMessageAt !== null
        ? formatDateTimeReadable(locale, childBucket.lastMessageAt)
        : null,
    isPublicDisplay: childBucket.isPublic ? t('publicYes') : t('publicNo'),
    rssItemPubDateDisplay:
      childBucket.rssItem?.rssItemPubDate !== undefined &&
      childBucket.rssItem?.rssItemPubDate !== null
        ? formatDateTimeReadable(locale, childBucket.rssItem.rssItemPubDate)
        : null,
    rssItemOrphaned: childBucket.rssItem?.orphaned ?? false,
  }));
  const showRssItemsVerificationGuidance =
    tab === 'buckets' &&
    bucket.type === 'rss-channel' &&
    childBucketsForContent.length === 0 &&
    (bucket.rss?.rssVerified === null || bucket.rss?.rssVerified === undefined);
  const breadcrumbItems: BreadcrumbItem[] = ancestors.map((ancestor) => ({
    label: ancestor.name,
    href: bucketDetailRoute(ancestor.shortId),
  }));
  const currentBreadcrumb: BreadcrumbItem = { label: bucket.name, href: undefined };
  const showBucketsTab = bucket.type !== 'rss-item' && bucket.type !== 'mb-leaf';
  const bucketVisibilityLabel = bucket.isPublic ? t('publicLabel') : t('privateLabel');

  const tabItems = [
    { href: bucketDetailRoute(id), label: t('messages'), itemKey: 'tab-messages' },
    ...(showBucketsTab
      ? [{ href: bucketDetailRoute(id), label: t('buckets'), itemKey: 'tab-buckets' }]
      : []),
    ...(bucket.type === 'rss-channel'
      ? [{ href: bucketDetailRoute(id), label: t('addToRss'), itemKey: 'tab-add-to-rss' }]
      : []),
    ...(bucket.type === 'mb-root' || bucket.type === 'mb-mid' || bucket.type === 'mb-leaf'
      ? [{ href: bucketDetailRoute(id), label: t('endpointTab'), itemKey: 'tab-endpoint' }]
      : []),
    { href: bucketSettingsRoute(id), label: t('settings'), itemKey: 'tab-settings' },
  ];

  const messagesListItems = mapBucketMessagesToListItems(messagesResult.messages, t, locale, {
    id: bucket.id,
    type: bucket.type,
  });

  return (
    <BucketDetailPageLayout
      breadcrumbs={
        breadcrumbItems.length > 0 ? (
          <Breadcrumbs
            items={[...breadcrumbItems, currentBreadcrumb]}
            LinkComponent={BreadcrumbLink}
            ariaLabel={t('bucketSettings')}
          />
        ) : undefined
      }
    >
      <BucketDetailTabShell
        serverInitialTab={tab}
        bucketPath={bucketDetailRoute(id)}
        bucketType={bucket.type}
        tabItems={tabItems}
        messagesPanel={
          <BucketMessagesTabClient
            bucketId={id}
            viewedBucket={{ id: bucket.id, type: bucket.type }}
            bucketPath={bucketDetailRoute(id)}
            navCookieName={BUCKET_DETAIL_NAV_COOKIE_NAME}
            initialMessages={messagesListItems}
            initialPage={messagesResult.page}
            initialTotalPages={messagesResult.totalPages}
            limit={messagesResult.limit}
            initialSort={sort === 'oldest' ? 'oldest' : 'recent'}
            initialIncludeBlockedSenderMessages={includeBlockedSenderMessages}
            emptyMessage={t('noMessagesYet')}
            messagesTitle={t('messages')}
            sortLabel={t('messagesSort.label')}
            sortOptionLabels={{
              recent: t('messagesSortOptions.recent'),
              oldest: t('messagesSortOptions.oldest'),
            }}
            allowBlockSender={canDeleteMessages}
            serverMessagesWereLoaded={tabForQuery === 'messages'}
          />
        }
        addToRssPanel={
          <SectionWithHeading title={t('addToRss')}>
            <AddToRssPanel
              bucketShortId={bucket.shortId}
              bucketId={bucket.id}
              rssFeedUrl={bucket.rss?.rssFeedUrl ?? null}
              initialVerifiedAt={bucket.rss?.rssVerified ?? null}
              initialVerificationFailedAt={bucket.rss?.rssVerificationFailedAt ?? null}
            />
          </SectionWithHeading>
        }
        endpointPanel={
          <SectionWithHeading title={t('endpointTab')}>
            <EndpointPanel bucketShortId={bucket.shortId} />
          </SectionWithHeading>
        }
        rssChannelBucketsPanel={
          <SectionWithHeading title={t('buckets')}>
            {showRssItemsVerificationGuidance ? (
              <Stack>
                <Text as="p" size="sm">
                  {t('rssItemsEmptyNeedsVerification')}
                </Text>
                <AddToRssTabLink bucketPath={bucketDetailRoute(id)}>
                  {t('openAddToRssTab')}
                </AddToRssTabLink>
              </Stack>
            ) : (
              <Table.ScrollContainer>
                <Table>
                  <Table.Head>
                    <Table.Row>
                      <Table.HeaderCell>{t('name')}</Table.HeaderCell>
                      <Table.HeaderCell>{t('rssItemPubDate')}</Table.HeaderCell>
                      <Table.HeaderCell>{t('status')}</Table.HeaderCell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {childBucketsForContent.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={3}>{t('noBucketsYet')}</Table.Cell>
                      </Table.Row>
                    ) : (
                      childBucketsForContent.map((childBucket) => (
                        <Table.Row key={childBucket.id}>
                          <Table.Cell>
                            <Link href={childBucket.href}>{childBucket.name}</Link>
                          </Table.Cell>
                          <Table.Cell>{childBucket.rssItemPubDateDisplay ?? '—'}</Table.Cell>
                          <Table.Cell>
                            {childBucket.rssItemOrphaned ? (
                              <Row>
                                <i className="fa-solid fa-triangle-exclamation" aria-hidden />
                                <Text as="span" size="sm">
                                  {t('rssItemOrphanedWarning')}
                                </Text>
                              </Row>
                            ) : (
                              t('rssItemActive')
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table>
              </Table.ScrollContainer>
            )}
          </SectionWithHeading>
        }
        childBucketsForContent={childBucketsForContent}
        bucketsSortBy={bucketsSortBy}
        bucketsSortOrder={bucketsSortOrder}
        bucketShortId={id}
        bucketName={
          <span
            style={{
              display: 'inline-flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <span>{bucket.name}</span>
            <span
              style={{
                display: 'inline-flex',
                width: '1.25em',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              role="img"
              aria-label={bucketVisibilityLabel}
              title={bucketVisibilityLabel}
            >
              <i className={bucket.isPublic ? 'fa-solid fa-globe' : 'fa-solid fa-lock'} />
            </span>
          </span>
        }
        detailItems={detailItems}
        showMessagesLink={false}
        messagesHref={undefined}
        messagesLabel={t('messages')}
        showPublicLink={false}
        publicHref={undefined}
        publicLabel={t('publicPage')}
        showSettingsLink={false}
        settingsHref={undefined}
        settingsLabel={t('settings')}
        preActionAreaSlot={
          <BucketSummaryPanel
            key={id}
            scope="bucket"
            bucketId={id}
            initialSummary={initialSummary}
            initialPref={bucketSummaryInitialPref}
          />
        }
        bucketsTitle={t('buckets')}
        showBucketActionsColumn={false}
        createBucketHref={
          bucket.type === 'rss-network' || bucket.type === 'mb-root' || bucket.type === 'mb-mid'
            ? bucketNewRouteFromAncestry([id])
            : undefined
        }
        createBucketLabel={
          bucket.type === 'rss-network' || bucket.type === 'mb-root' || bucket.type === 'mb-mid'
            ? t('addBucket')
            : undefined
        }
        bucketsColumnName={t('name')}
        bucketsColumnLastMessage={t('lastMessage')}
        bucketsColumnCreated={t('created')}
        bucketsColumnPublic={t('isPublic')}
        bucketsEmptyMessage={t('noBucketsYet')}
        bucketsSortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
        wrapInContainer={false}
      />
    </BucketDetailPageLayout>
  );
}
