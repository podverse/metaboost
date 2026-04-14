import type { Bucket } from '@metaboost/helpers-requests';
import type { BreadcrumbItem } from '@metaboost/ui';

import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';

import { DEFAULT_PAGE_LIMIT, formatUserLabel } from '@metaboost/helpers';
import { formatDateTimeReadable } from '@metaboost/helpers-i18n';
import {
  BUCKET_DETAIL_BUCKETS_LIST_KEY,
  Breadcrumbs,
  BucketDetailContent,
  BucketDetailPageLayout,
  CrudButtons,
  getMessagesSortFromCookieValue,
  getSortPrefsFromCookieValue,
  Link,
  Row,
  SectionWithHeading,
  Stack,
  Table,
  Text,
} from '@metaboost/ui';

import { canEditBucketMessages } from '../../../../lib/bucket-authz';
import {
  fetchAdmins,
  fetchBucket,
  fetchBucketAncestry,
  fetchChildBuckets,
  fetchMessagesPaginated,
} from '../../../../lib/buckets';
import { TABLE_SORT_PREFS_COOKIE_NAME } from '../../../../lib/cookies';
import {
  ROUTES,
  bucketDetailRoute,
  bucketDetailTabRoute,
  bucketEditRoute,
  bucketNewRouteFromAncestry,
  bucketSettingsRoute,
  publicBucketRoute,
} from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';
import { AddToRssPanel } from './AddToRssPanel';
import { BucketDetailTabsClient } from './BucketDetailTabsClient';
import { BucketMessagesPanel } from './BucketMessagesPanel';
import { MessagesHeaderControls } from './MessagesHeaderControls';

function formatAdminLabel(
  admin: {
    user: {
      username?: string | null;
      email?: string | null;
      displayName?: string | null;
    } | null;
    userId: string;
  },
  isOwner: boolean
): string {
  const label =
    admin.user !== undefined && admin.user !== null
      ? formatUserLabel({
          username: admin.user.username,
          email: admin.user.email,
          displayName: admin.user.displayName,
        })
      : admin.userId;
  return isOwner ? `${label} (owner)` : label;
}

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

function buildMessageMetadataItems(
  t: Awaited<ReturnType<typeof getTranslations>>,
  message: {
    amount?: string | null;
    currency?: string | null;
    amountUnit?: string | null;
    appName?: string | null;
    senderName?: string | null;
    senderId?: string | null;
  }
): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = [];
  if (message.amount !== undefined && message.amount !== null && message.amount !== '') {
    if (message.currency === 'BTC' && message.amountUnit === 'sats') {
      items.push({
        label: t('messageMeta.amount'),
        value: `${message.amount} ${t('messageMeta.satoshis')} (BTC)`,
      });
    } else if (
      message.amountUnit !== undefined &&
      message.amountUnit !== null &&
      message.amountUnit !== ''
    ) {
      const currency =
        message.currency !== undefined && message.currency !== null && message.currency !== ''
          ? message.currency
          : t('notAvailable');
      items.push({
        label: t('messageMeta.amount'),
        value: `${message.amount} ${message.amountUnit} (${currency})`,
      });
    } else {
      const currency =
        message.currency !== undefined && message.currency !== null && message.currency !== ''
          ? message.currency
          : '';
      items.push({
        label: t('messageMeta.amount'),
        value: currency === '' ? message.amount : `${message.amount} ${currency}`,
      });
    }
  }
  if (message.currency !== undefined && message.currency !== null && message.currency !== '') {
    items.push({ label: t('messageMeta.currency'), value: message.currency });
  }
  if (
    message.amountUnit !== undefined &&
    message.amountUnit !== null &&
    message.amountUnit !== ''
  ) {
    items.push({ label: t('messageMeta.amountUnit'), value: message.amountUnit });
  }
  if (message.appName !== undefined && message.appName !== null && message.appName !== '') {
    items.push({ label: t('messageMeta.appName'), value: message.appName });
  }
  if (
    message.senderName !== undefined &&
    message.senderName !== null &&
    message.senderName !== ''
  ) {
    items.push({ label: t('messageMeta.senderName'), value: message.senderName });
  }
  if (message.senderId !== undefined && message.senderId !== null && message.senderId !== '') {
    items.push({ label: t('messageMeta.senderId'), value: message.senderId });
  }
  return items;
}

export default async function BucketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    page?: string;
    sort?: string;
    sortBy?: string;
    sortOrder?: string;
    includeUnverified?: string;
  }>;
}) {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedTab = resolvedSearchParams.tab;
  const tabForQuery = requestedTab === 'buckets' ? 'buckets' : 'messages';
  const includeUnverified = resolvedSearchParams.includeUnverified === '1';
  const page = Math.max(1, parseInt(resolvedSearchParams.page ?? '1', 10) || 1);

  const cookieStore = await cookies();
  const sortPrefsCookieValue = cookieStore.get(TABLE_SORT_PREFS_COOKIE_NAME)?.value;

  const sort =
    resolvedSearchParams.sort !== undefined
      ? resolvedSearchParams.sort === 'oldest'
        ? 'oldest'
        : 'recent'
      : (getMessagesSortFromCookieValue(sortPrefsCookieValue) ?? 'recent');

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
    requestedTab === 'buckets'
      ? 'buckets'
      : requestedTab === 'add-to-rss' && bucket.type === 'rss-channel'
        ? 'add-to-rss'
        : 'messages';

  const canToggleUnverified = await canEditBucketMessages(bucket.id, bucket.ownerId, user);
  const [childBuckets, admins, ancestors, messagesResult] = await Promise.all([
    fetchChildBuckets(id),
    fetchAdmins(id),
    fetchBucketAncestry(bucket),
    tabForQuery === 'messages'
      ? fetchMessagesPaginated(
          id,
          page,
          DEFAULT_PAGE_LIMIT,
          sort,
          canToggleUnverified && includeUnverified
        )
      : Promise.resolve({
          messages: [],
          page: 1,
          limit: DEFAULT_PAGE_LIMIT,
          total: 0,
          totalPages: 1,
        }),
  ]);

  const t = await getTranslations('buckets');
  const locale = await getLocale();
  const isViewerOwner = user.id === bucket.ownerId;
  const ownerAdmin = admins.find((a) => a.userId === bucket.ownerId);
  const ownerLabel = (() => {
    if (isViewerOwner) {
      const label = formatUserLabel({
        username: user.username,
        email: user.email,
        displayName: user.displayName,
      });
      return label === '—' ? t('anonymous') : label;
    }
    if (ownerAdmin?.user === undefined || ownerAdmin?.user === null) return t('anonymous');
    const label = formatUserLabel({
      username: ownerAdmin.user.username,
      email: ownerAdmin.user.email,
      displayName: ownerAdmin.user.displayName,
    });
    return label === '—' ? t('anonymous') : label;
  })();
  const detailItems = [
    { label: t('isPublic'), value: bucket.isPublic ? t('publicYes') : t('publicNo') },
    { label: t('owner'), value: ownerLabel },
    ...(admins.length > 0
      ? [
          {
            label: t('admins'),
            value: admins.map((a) => formatAdminLabel(a, a.userId === bucket.ownerId)).join(', '),
          },
        ]
      : []),
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
    editHref: bucketEditRoute(childBucket.shortId),
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
  const showBucketsTab = bucket.type !== 'rss-item';

  const tabItems = [
    { href: bucketDetailRoute(id), label: t('messages') },
    ...(showBucketsTab ? [{ href: bucketDetailTabRoute(id, 'buckets'), label: t('buckets') }] : []),
    ...(bucket.type === 'rss-channel'
      ? [{ href: bucketDetailTabRoute(id, 'add-to-rss'), label: t('addToRss') }]
      : []),
    ...(bucket.isPublic
      ? [{ href: publicBucketRoute(bucket.shortId), label: t('publicPage') }]
      : []),
    ...(bucket.parentBucketId === null
      ? [{ href: bucketSettingsRoute(id), label: t('settings') }]
      : []),
  ];
  const activeHref =
    tab === 'buckets'
      ? bucketDetailTabRoute(id, 'buckets')
      : tab === 'add-to-rss'
        ? bucketDetailTabRoute(id, 'add-to-rss')
        : bucketDetailRoute(id);

  const messagesListItems = messagesResult.messages.map((m) => ({
    id: m.id,
    senderName: m.senderName,
    body: m.body,
    isPublic: m.isPublic,
    createdAt: m.createdAt,
    bucketId: m.bucketId,
    metadataItems: buildMessageMetadataItems(t, {
      amount: m.amount ?? null,
      currency: m.currency ?? null,
      amountUnit: m.amountUnit ?? null,
      appName: m.appName ?? null,
      senderName: m.senderName ?? null,
      senderId: m.senderId ?? null,
    }),
  }));

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
      <BucketDetailContent
        bucketName={bucket.name}
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
        actionArea={<BucketDetailTabsClient items={tabItems} activeHref={activeHref} />}
        messagesSlot={
          tab === 'messages' ? (
            <SectionWithHeading
              title={t('messages')}
              headingAction={
                <MessagesHeaderControls
                  sort={sort}
                  basePath={bucketDetailRoute(id)}
                  label={t('messagesSort.label')}
                  sortOptionLabels={{
                    recent: t('messagesSortOptions.recent'),
                    oldest: t('messagesSortOptions.oldest'),
                  }}
                  sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
                  filtersButtonAriaLabel={t('messagesFilters')}
                  showUnverifiedMessagesLabel={t('showUnverifiedMessages')}
                  includeUnverified={canToggleUnverified && includeUnverified}
                  showUnverifiedControl={canToggleUnverified}
                />
              }
            >
              <BucketMessagesPanel
                bucketId={id}
                messages={messagesListItems}
                emptyMessage={t('noMessagesYet')}
                page={messagesResult.page}
                totalPages={messagesResult.totalPages}
                limit={messagesResult.limit}
                basePath={bucketDetailRoute(id)}
                queryParams={{
                  tab: 'messages',
                  ...(canToggleUnverified && includeUnverified ? { includeUnverified: '1' } : {}),
                  ...(sort === 'oldest' ? { sort: 'oldest' } : {}),
                }}
              />
            </SectionWithHeading>
          ) : tab === 'add-to-rss' ? (
            <SectionWithHeading title={t('addToRss')}>
              <AddToRssPanel
                bucketShortId={bucket.shortId}
                bucketId={bucket.id}
                rssFeedUrl={bucket.rss?.rssFeedUrl ?? null}
                initialVerifiedAt={bucket.rss?.rssVerified ?? null}
              />
            </SectionWithHeading>
          ) : tab === 'buckets' && bucket.type === 'rss-channel' ? (
            <SectionWithHeading title={t('buckets')}>
              {showRssItemsVerificationGuidance ? (
                <Stack gap="sm">
                  <Text as="p" size="sm">
                    {t('rssItemsEmptyNeedsVerification')}
                  </Text>
                  <Link href={bucketDetailTabRoute(id, 'add-to-rss')}>{t('openAddToRssTab')}</Link>
                </Stack>
              ) : (
                <Table.ScrollContainer>
                  <Table>
                    <Table.Head>
                      <Table.Row>
                        <Table.HeaderCell>{t('name')}</Table.HeaderCell>
                        <Table.HeaderCell>{t('rssItemPubDate')}</Table.HeaderCell>
                        <Table.HeaderCell>{t('status')}</Table.HeaderCell>
                        <Table.HeaderCell>{t('actions')}</Table.HeaderCell>
                      </Table.Row>
                    </Table.Head>
                    <Table.Body>
                      {childBucketsForContent.length === 0 ? (
                        <Table.Row>
                          <Table.Cell colSpan={4}>{t('noBucketsYet')}</Table.Cell>
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
                            <Table.Cell>
                              <CrudButtons
                                viewHref={childBucket.href}
                                viewLabel={t('view')}
                                editHref={childBucket.editHref}
                                editLabel={t('edit')}
                              />
                            </Table.Cell>
                          </Table.Row>
                        ))
                      )}
                    </Table.Body>
                  </Table>
                </Table.ScrollContainer>
              )}
            </SectionWithHeading>
          ) : undefined
        }
        messagesSlotMaxWidth={
          tab === 'buckets' && bucket.type === 'rss-channel' ? 'none' : 'readable'
        }
        buckets={
          tab === 'buckets' && bucket.type !== 'rss-channel' ? childBucketsForContent : undefined
        }
        bucketsTitle={t('buckets')}
        bucketViewLabel={t('view')}
        bucketEditLabel={t('edit')}
        bucketDeleteLabel={t('delete')}
        createBucketHref={
          bucket.type === 'rss-network' ? bucketNewRouteFromAncestry([id]) : undefined
        }
        createBucketLabel={bucket.type === 'rss-network' ? t('addBucket') : undefined}
        bucketsColumnName={t('name')}
        bucketsColumnLastMessage={t('lastMessage')}
        bucketsColumnCreated={t('created')}
        bucketsColumnPublic={t('isPublic')}
        bucketsColumnActions={t('actions')}
        bucketsEmptyMessage={t('noBucketsYet')}
        bucketsSortBy={tab === 'buckets' ? bucketsSortBy : undefined}
        bucketsSortOrder={tab === 'buckets' ? bucketsSortOrder : undefined}
        bucketsSortBasePath={tab === 'buckets' ? bucketDetailTabRoute(id, 'buckets') : undefined}
        bucketsSortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
        wrapInContainer={false}
      />
    </BucketDetailPageLayout>
  );
}
