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
import { canCreateChildBuckets } from '../../../../lib/bucket-authz';
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
  bucketNewRouteFromAncestry,
  bucketSettingsRoute,
} from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';
import { AddToRssPanel } from './AddToRssPanel';
import { BucketDetailTabsClient } from './BucketDetailTabsClient';
import { BucketMessagesPanel } from './BucketMessagesPanel';
import { EndpointPanel } from './EndpointPanel';
import { MessagesHeaderControls } from './MessagesHeaderControls';

type BucketSearchParams = {
  tab?: string;
  page?: string;
  sort?: string;
  sortBy?: string;
  sortOrder?: string;
  /** When "1", do not redirect an empty RSS Network to Add RSS channel (e.g. return from cancel on /new). */
  skipEmptyRssNetworkRedirect?: string;
};

type BucketMessageSourceBucketContext = {
  bucket: {
    id: string;
    shortId: string;
    name: string;
    type: Bucket['type'];
  };
  parentBucket: {
    id: string;
    shortId: string;
    name: string;
    type: Bucket['type'];
  } | null;
};

type MessageMiniBreadcrumbItem = {
  label: string;
  href: string;
};

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

function formatUsdAmount(amount: string): string {
  const parsed = Number.parseFloat(amount);
  if (Number.isNaN(parsed)) {
    return amount;
  }
  return `$${parsed.toFixed(2)}`;
}

function isSatoshisUnit(amountUnit: string | null | undefined): boolean {
  if (amountUnit === undefined || amountUnit === null) {
    return false;
  }
  const normalized = amountUnit.trim().toLowerCase();
  return normalized === 'satoshi' || normalized === 'satoshis';
}

function buildUnknownAmountDisplay(
  amount: string,
  currency: string | null | undefined,
  amountUnit: string | null | undefined
): string {
  const segments = [amount];
  const currencyValue = currency?.trim() ?? '';
  const amountUnitValue = amountUnit?.trim() ?? '';
  if (currencyValue !== '') {
    segments.push(currencyValue);
  }
  if (amountUnitValue !== '') {
    segments.push(amountUnitValue);
  }
  return segments.join(' ');
}

function buildMessageAmountLine(
  t: Awaited<ReturnType<typeof getTranslations>>,
  message: {
    amount?: string | null;
    currency?: string | null;
    amountUnit?: string | null;
  }
): string | null {
  if (message.amount === undefined || message.amount === null || message.amount === '') {
    return null;
  }
  const amountValue = message.amount;
  const currencyRaw = message.currency?.trim() ?? '';
  const amountUnitRaw = message.amountUnit?.trim() ?? '';
  const currency = currencyRaw.toUpperCase();

  if (currency === 'BTC') {
    if (isSatoshisUnit(amountUnitRaw)) {
      return `${amountValue} ${t('messageMeta.satoshis')}`;
    }
    return `${amountValue} ${t('messageMeta.bitcoin')}`;
  }

  if (currency === 'USD') {
    return formatUsdAmount(amountValue);
  }

  return buildUnknownAmountDisplay(amountValue, currencyRaw, amountUnitRaw);
}

/** Ingest / public message fields: show literal `undefined` when absent (per product spec). */
function formatMbrssV1DetailValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 'undefined';
  }
  return typeof value === 'number' ? String(value) : value;
}

function buildMbrssV1IdentitySection(
  t: Awaited<ReturnType<typeof getTranslations>>,
  message: { id: string; messageGuid?: string | null }
): { title: string; items: Array<{ label: string; value: string }> } {
  const messageGuidDisplay = message.messageGuid ?? message.id;
  return {
    title: t('mbrssV1Section.identity'),
    items: [
      {
        label: t('mbrssV1Field.message_guid'),
        value: formatMbrssV1DetailValue(messageGuidDisplay),
      },
    ],
  };
}

function buildMbrssV1DetailsSections(
  t: Awaited<ReturnType<typeof getTranslations>>,
  message: {
    senderName?: string | null;
    senderGuid?: string | null;
    currency?: string | null;
    amount?: string | null;
    amountUnit?: string | null;
    appName?: string | null;
    appVersion?: string | null;
    podcastIndexFeedId?: number | null;
    timePosition?: string | null;
  }
): Array<{ title: string; items: Array<{ label: string; value: string }> }> {
  const sections: Array<{ title: string; items: Array<{ label: string; value: string }> }> = [
    {
      title: t('mbrssV1Section.sender'),
      items: [
        {
          label: t('mbrssV1Field.sender_name'),
          value: formatMbrssV1DetailValue(message.senderName),
        },
        {
          label: t('mbrssV1Field.sender_guid'),
          value: formatMbrssV1DetailValue(message.senderGuid),
        },
      ],
    },
    {
      title: t('mbrssV1Section.value'),
      items: [
        { label: t('mbrssV1Field.currency'), value: formatMbrssV1DetailValue(message.currency) },
        { label: t('mbrssV1Field.amount'), value: formatMbrssV1DetailValue(message.amount) },
        {
          label: t('mbrssV1Field.amount_unit'),
          value: formatMbrssV1DetailValue(message.amountUnit),
        },
      ],
    },
    {
      title: t('mbrssV1Section.app'),
      items: [
        { label: t('mbrssV1Field.app_name'), value: formatMbrssV1DetailValue(message.appName) },
        {
          label: t('mbrssV1Field.app_version'),
          value: formatMbrssV1DetailValue(message.appVersion),
        },
      ],
    },
  ];

  if (message.podcastIndexFeedId !== null && message.podcastIndexFeedId !== undefined) {
    sections.push({
      title: t('mbrssV1Section.rssFeed'),
      items: [
        {
          label: t('mbrssV1Field.podcast_index_feed_id'),
          value: formatMbrssV1DetailValue(message.podcastIndexFeedId),
        },
      ],
    });
  }

  sections.push({
    title: t('mbrssV1Section.playback'),
    items: [
      {
        label: t('mbrssV1Field.time_position'),
        value: formatMbrssV1DetailValue(message.timePosition),
      },
    ],
  });

  return sections;
}

function buildMessageMiniBreadcrumbItems(
  viewedBucket: { id: string; type: Bucket['type'] },
  sourceBucketContext: BucketMessageSourceBucketContext | undefined
): MessageMiniBreadcrumbItem[] {
  if (sourceBucketContext === undefined) {
    return [];
  }

  const sourceBucket = sourceBucketContext.bucket;
  const parentBucket = sourceBucketContext.parentBucket;

  if (viewedBucket.type === 'rss-network') {
    if (sourceBucket.type === 'rss-channel') {
      return [{ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) }];
    }
    if (sourceBucket.type === 'rss-item') {
      const items: MessageMiniBreadcrumbItem[] = [];
      if (parentBucket !== null && parentBucket.type === 'rss-channel') {
        items.push({ label: parentBucket.name, href: bucketDetailRoute(parentBucket.shortId) });
      }
      items.push({ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) });
      return items;
    }
    return [];
  }

  if (viewedBucket.type === 'rss-channel') {
    if (sourceBucket.type === 'rss-item') {
      return [{ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) }];
    }
    if (sourceBucket.type === 'rss-channel' && sourceBucket.id === viewedBucket.id) {
      return [];
    }
  }

  if (viewedBucket.type === 'mb-root') {
    if (sourceBucket.type === 'mb-mid') {
      return [{ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) }];
    }
    if (sourceBucket.type === 'mb-leaf') {
      const items: MessageMiniBreadcrumbItem[] = [];
      if (parentBucket !== null && parentBucket.type === 'mb-mid') {
        items.push({ label: parentBucket.name, href: bucketDetailRoute(parentBucket.shortId) });
      }
      items.push({ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) });
      return items;
    }
    return [];
  }

  if (viewedBucket.type === 'mb-mid') {
    if (sourceBucket.type === 'mb-leaf') {
      return [{ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) }];
    }
    if (sourceBucket.type === 'mb-mid' && sourceBucket.id === viewedBucket.id) {
      return [];
    }
  }

  return [];
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
  const requestedTab = resolvedSearchParams.tab;
  const tabForQuery =
    requestedTab === 'buckets' ? 'buckets' : requestedTab === 'endpoint' ? 'endpoint' : 'messages';
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
        : requestedTab === 'endpoint' &&
            (bucket.type === 'mb-root' || bucket.type === 'mb-mid' || bucket.type === 'mb-leaf')
          ? 'endpoint'
          : 'messages';

  const [childBuckets, admins, ancestors, messagesResult] = await Promise.all([
    fetchChildBuckets(id),
    fetchAdmins(id),
    fetchBucketAncestry(bucket),
    tabForQuery === 'messages'
      ? fetchMessagesPaginated(id, page, DEFAULT_PAGE_LIMIT, sort)
      : Promise.resolve({
          messages: [],
          page: 1,
          limit: DEFAULT_PAGE_LIMIT,
          total: 0,
          totalPages: 1,
        }),
  ]);

  const skipEmptyRssNetworkRedirect = resolvedSearchParams.skipEmptyRssNetworkRedirect === '1';
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
    { label: t('isPublic'), value: bucket.isPublic ? t('publicYes') : t('publicNo') },
    { label: t('owner'), value: ownerLabel },
    ...(rssItemPubDateValue !== null
      ? [{ label: t('rssItemPubDate'), value: rssItemPubDateValue }]
      : []),
    ...(rssGuidValue !== null ? [{ label: t('guid'), value: rssGuidValue }] : []),
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

  const tabItems = [
    { href: bucketDetailRoute(id), label: t('messages') },
    ...(showBucketsTab ? [{ href: bucketDetailTabRoute(id, 'buckets'), label: t('buckets') }] : []),
    ...(bucket.type === 'rss-channel'
      ? [{ href: bucketDetailTabRoute(id, 'add-to-rss'), label: t('addToRss') }]
      : []),
    ...(bucket.type === 'mb-root' || bucket.type === 'mb-mid' || bucket.type === 'mb-leaf'
      ? [{ href: bucketDetailTabRoute(id, 'endpoint'), label: t('endpointTab') }]
      : []),
    { href: bucketSettingsRoute(id), label: t('settings') },
  ];
  const activeHref =
    tab === 'buckets'
      ? bucketDetailTabRoute(id, 'buckets')
      : tab === 'add-to-rss'
        ? bucketDetailTabRoute(id, 'add-to-rss')
        : tab === 'endpoint'
          ? bucketDetailTabRoute(id, 'endpoint')
          : bucketDetailRoute(id);

  const messagesListItems = messagesResult.messages.map((m) => {
    const amountLine = buildMessageAmountLine(t, {
      amount: m.amount ?? null,
      currency: m.currency ?? null,
      amountUnit: m.amountUnit ?? null,
    });
    return {
      id: m.id,
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt,
      bucketId: m.bucketId,
      amountLine,
      detailsSections: [
        ...buildMbrssV1DetailsSections(t, {
          senderName: m.senderName ?? null,
          senderGuid: m.senderGuid ?? null,
          currency: m.currency ?? null,
          amount: m.amount ?? null,
          amountUnit: m.amountUnit ?? null,
          appName: m.appName ?? null,
          appVersion: m.appVersion ?? null,
          podcastIndexFeedId: m.podcastIndexFeedId ?? null,
          timePosition: m.timePosition ?? null,
        }),
        buildMbrssV1IdentitySection(t, { id: m.id, messageGuid: m.messageGuid ?? null }),
      ],
      appName: m.appName ?? null,
      miniBreadcrumbItems: buildMessageMiniBreadcrumbItems(
        { id: bucket.id, type: bucket.type },
        m.sourceBucketContext
      ),
    };
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
        preActionAreaSlot={<BucketSummaryPanel scope="bucket" bucketId={id} />}
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
                initialVerificationFailedAt={bucket.rss?.rssVerificationFailedAt ?? null}
              />
            </SectionWithHeading>
          ) : tab === 'endpoint' ? (
            <SectionWithHeading title={t('endpointTab')}>
              <EndpointPanel bucketShortId={bucket.shortId} />
            </SectionWithHeading>
          ) : tab === 'buckets' && bucket.type === 'rss-channel' ? (
            <SectionWithHeading title={t('buckets')}>
              {showRssItemsVerificationGuidance ? (
                <Stack>
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
          ) : undefined
        }
        messagesSlotMaxWidth={
          tab === 'buckets' && bucket.type === 'rss-channel' ? 'none' : 'readable'
        }
        buckets={
          tab === 'buckets' && bucket.type !== 'rss-channel' ? childBucketsForContent : undefined
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
        bucketsSortBy={tab === 'buckets' ? bucketsSortBy : undefined}
        bucketsSortOrder={tab === 'buckets' ? bucketsSortOrder : undefined}
        bucketsSortBasePath={tab === 'buckets' ? bucketDetailTabRoute(id, 'buckets') : undefined}
        bucketsSortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
        wrapInContainer={false}
      />
    </BucketDetailPageLayout>
  );
}
