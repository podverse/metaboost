import type { ListBucketMessagesResponse } from '@metaboost/helpers-requests';
import type { ManagementBucket, ManagementBucketMessage } from '@metaboost/helpers-requests';
import type { BreadcrumbItem, BucketDetailNavTab } from '@metaboost/ui';

import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { formatDateTimeReadable } from '@metaboost/helpers-i18n/client';
import { request, managementWebBuckets } from '@metaboost/helpers-requests';
import {
  BUCKET_DETAIL_BUCKETS_LIST_KEY,
  Breadcrumbs,
  BucketDetailPageLayout,
  getBucketDetailNavEntryFromCookieValue,
  getMessagesSortFromCookieValue,
  getSortPrefsFromCookieValue,
  Link,
} from '@metaboost/ui';

import { getServerManagementApiBaseUrl, getWebAppUrl } from '../../../../config/env';
import {
  BUCKET_DETAIL_NAV_COOKIE_NAME,
  TABLE_SORT_PREFS_COOKIE_NAME,
} from '../../../../lib/cookies';
import { getCrudFlags, hasReadPermission } from '../../../../lib/main-nav';
import { ROUTES } from '../../../../lib/routes';
import {
  bucketEditRoute,
  bucketViewRoute,
  bucketSettingsRoute,
  bucketNewRouteFromAncestry,
} from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';
import { getCookieHeader } from '../../../../lib/server-request';
import { BucketDetailTabShell } from './BucketDetailTabShell';
import { BucketMessagesSectionClient } from './BucketMessagesSectionClient';

const requestOptions = { cache: 'no-store' as RequestCache } as const;

async function fetchBucket(id: string): Promise<ManagementBucket | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${id}`, {
    headers: { Cookie: cookieHeader },
    ...requestOptions,
  });
  if (!res.ok || res.data === undefined) return null;
  const data = res.data as { bucket?: ManagementBucket };
  return data.bucket ?? null;
}

async function fetchChildBuckets(bucketId: string): Promise<ManagementBucket[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const res = await managementWebBuckets.getChildBuckets(baseUrl, bucketId, {
    headers: { Cookie: cookieHeader },
    ...requestOptions,
  });
  if (!res.ok || res.data === undefined) return [];
  const data = res.data;
  return Array.isArray(data.buckets) ? data.buckets : [];
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

async function fetchBucketAncestry(bucket: ManagementBucket): Promise<ManagementBucket[]> {
  const parents: ManagementBucket[] = [];
  let parentId = bucket.parentBucketId;
  while (parentId !== null) {
    const parent = await fetchBucket(parentId);
    if (parent === null) {
      break;
    }
    parents.unshift(parent);
    parentId = parent.parentBucketId;
  }
  return parents;
}

async function fetchMessagesPaginated(
  bucketId: string,
  page: number,
  limit: number,
  sort: 'recent' | 'oldest'
): Promise<{
  messages: ManagementBucketMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (limit !== DEFAULT_PAGE_LIMIT) params.set('limit', String(limit));
  if (sort === 'oldest') params.set('sort', 'oldest');
  const query = params.toString();
  const path =
    query !== '' ? `/buckets/${bucketId}/messages?${query}` : `/buckets/${bucketId}/messages`;
  const res = await request<ListBucketMessagesResponse>(baseUrl, path, {
    headers: { Cookie: cookieHeader },
    ...requestOptions,
  });
  if (!res.ok || res.data === undefined) {
    return {
      messages: [],
      page: 1,
      limit,
      total: 0,
      totalPages: 1,
    };
  }
  const data = res.data;
  const messages = Array.isArray(data.messages) ? data.messages : [];
  return {
    messages,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : limit,
    total: typeof data.total === 'number' ? data.total : 0,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
  };
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
  }>;
}) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const canReadBuckets =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketsCrud');
  if (!canReadBuckets) redirect(ROUTES.DASHBOARD);

  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const cookieStore = await cookies();
  const bucketPathForNav = bucketViewRoute(id);
  const navEntry = getBucketDetailNavEntryFromCookieValue(
    cookieStore.get(BUCKET_DETAIL_NAV_COOKIE_NAME)?.value,
    bucketPathForNav
  );

  const page =
    resolvedSearchParams.page !== undefined
      ? Math.max(1, parseInt(resolvedSearchParams.page, 10) || 1)
      : Math.max(1, navEntry?.messagesPage ?? 1);

  const rawTabParam = resolvedSearchParams.tab;

  const tab =
    rawTabParam === 'buckets' ? 'buckets' : rawTabParam === 'messages' ? 'messages' : 'messages';

  const sortPrefsCookieValue = cookieStore.get(TABLE_SORT_PREFS_COOKIE_NAME)?.value;

  const sort =
    resolvedSearchParams.sort !== undefined
      ? resolvedSearchParams.sort === 'oldest'
        ? 'oldest'
        : 'recent'
      : (getMessagesSortFromCookieValue(sortPrefsCookieValue) ?? 'recent');

  const bucketsSortBy =
    tab === 'buckets'
      ? resolvedSearchParams.sortBy === 'name' ||
        resolvedSearchParams.sortBy === 'lastMessage' ||
        resolvedSearchParams.sortBy === 'created'
        ? resolvedSearchParams.sortBy
        : (getSortPrefsFromCookieValue(sortPrefsCookieValue, BUCKET_DETAIL_BUCKETS_LIST_KEY)
            ?.sortBy ?? BUCKETS_DEFAULT_SORT_BY)
      : undefined;
  const bucketsSortOrder =
    tab === 'buckets'
      ? resolvedSearchParams.sortOrder === 'desc' || resolvedSearchParams.sortOrder === 'asc'
        ? resolvedSearchParams.sortOrder
        : (getSortPrefsFromCookieValue(sortPrefsCookieValue, BUCKET_DETAIL_BUCKETS_LIST_KEY)
            ?.sortOrder ?? 'asc')
      : undefined;

  const bucket = await fetchBucket(id);
  if (bucket === null) notFound();

  const canReadMessages =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketMessagesCrud');
  const [childBuckets, ancestors, messagesResult] = await Promise.all([
    fetchChildBuckets(id),
    fetchBucketAncestry(bucket),
    tab === 'messages' && canReadMessages
      ? fetchMessagesPaginated(id, page, DEFAULT_PAGE_LIMIT, sort)
      : Promise.resolve({
          messages: [],
          page: 1,
          limit: DEFAULT_PAGE_LIMIT,
          total: 0,
          totalPages: 1,
        }),
  ]);
  const locale = await getLocale();

  const tCommon = await getTranslations('common');
  const showMessagesTab =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketMessagesCrud');
  const bucketsCrud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'bucketsCrud');
  const detailItems = [
    {
      label: tCommon('bucketDetail.isPublic'),
      value: bucket.isPublic ? tCommon('bucketDetail.publicYes') : tCommon('bucketDetail.publicNo'),
    },
    {
      label: tCommon('bucketDetail.owner'),
      value: bucket.ownerDisplayName ?? bucket.ownerId,
    },
  ];

  const bucketAncestryForNewChild = [...ancestors.map((a) => a.idText), bucket.idText];
  const canCreateBucket = bucketsCrud.create;
  const createBucketHref = canCreateBucket
    ? bucketNewRouteFromAncestry(bucketAncestryForNewChild)
    : undefined;
  const createBucketLabel = canCreateBucket ? tCommon('bucketDetail.addBucket') : undefined;

  const sortedChildBuckets =
    tab === 'buckets' && bucketsSortBy !== undefined && bucketsSortOrder !== undefined
      ? sortChildBuckets(childBuckets, bucketsSortBy, bucketsSortOrder)
      : childBuckets;
  const childBucketsForContent = sortedChildBuckets.map((childBucket) => ({
    id: childBucket.id,
    name: childBucket.name,
    href: bucketViewRoute(childBucket.idText),
    editHref: bucketEditRoute(childBucket.idText),
    createdAtDisplay: formatDateTimeReadable(locale, childBucket.createdAt),
    lastMessageAtDisplay:
      childBucket.lastMessageAt !== undefined && childBucket.lastMessageAt !== null
        ? formatDateTimeReadable(locale, childBucket.lastMessageAt)
        : null,
    isPublicDisplay: childBucket.isPublic
      ? tCommon('bucketDetail.publicYes')
      : tCommon('bucketDetail.publicNo'),
  }));
  const breadcrumbItems: BreadcrumbItem[] = ancestors.map((ancestor) => ({
    label: ancestor.name,
    href: bucketViewRoute(ancestor.idText),
  }));
  const currentBreadcrumb: BreadcrumbItem = { label: bucket.name, href: undefined };

  const publicPageHref = bucket.isPublic
    ? (() => {
        const webUrl = getWebAppUrl();
        const path = `/b/${bucket.idText}`;
        return webUrl !== undefined ? `${webUrl}${path}` : path;
      })()
    : undefined;

  const tabItems = [
    ...(showMessagesTab
      ? [
          {
            href: bucketViewRoute(id),
            label: tCommon('bucketDetail.messages'),
            itemKey: 'tab-messages',
          },
        ]
      : []),
    { href: bucketViewRoute(id), label: tCommon('bucketDetail.buckets'), itemKey: 'tab-buckets' },
    ...(bucket.isPublic && publicPageHref !== undefined
      ? [{ href: publicPageHref, label: tCommon('bucketDetail.publicPage') }]
      : []),
    ...(bucketsCrud.update
      ? [{ href: bucketSettingsRoute(id), label: tCommon('bucketDetail.settings') }]
      : []),
  ];
  const serverInitialTab: BucketDetailNavTab = !showMessagesTab
    ? 'buckets'
    : tab === 'buckets'
      ? 'buckets'
      : 'messages';

  const messagesListItems = messagesResult.messages.map((m) => ({
    id: m.id,
    senderName: m.senderName,
    body: m.body,
    createdAt: m.createdAt,
    bucketId: m.bucketId,
    detailsSections: [],
  }));

  return (
    <BucketDetailPageLayout
      breadcrumbs={
        breadcrumbItems.length > 0 ? (
          <Breadcrumbs
            items={[...breadcrumbItems, currentBreadcrumb]}
            LinkComponent={BreadcrumbLink}
            ariaLabel={tCommon('bucketDetail.settings')}
          />
        ) : undefined
      }
    >
      <BucketDetailTabShell
        serverInitialTab={serverInitialTab}
        bucketPath={bucketViewRoute(id)}
        tabItems={tabItems}
        showMessagesTab={showMessagesTab}
        messagesSlot={
          showMessagesTab ? (
            <BucketMessagesSectionClient
              bucketId={id}
              bucketPath={bucketViewRoute(id)}
              navCookieName={BUCKET_DETAIL_NAV_COOKIE_NAME}
              sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
              serverMessagesWereLoaded={tab === 'messages'}
              initialMessages={messagesListItems}
              initialPage={messagesResult.page}
              initialTotalPages={messagesResult.totalPages}
              limit={messagesResult.limit}
              initialSort={sort === 'oldest' ? 'oldest' : 'recent'}
              emptyMessage={tCommon('bucketDetail.noMessagesYet')}
              messagesTitle={tCommon('bucketDetail.messages')}
              sortLabel={tCommon('eventsSort.label')}
              sortOptionLabels={{
                recent: tCommon('eventsSortOptions.recent'),
                oldest: tCommon('eventsSortOptions.oldest'),
              }}
            />
          ) : undefined
        }
        childBucketsForContent={childBucketsForContent}
        bucketsSortBy={bucketsSortBy}
        bucketsSortOrder={bucketsSortOrder}
        bucketIdText={id}
        bucketName={bucket.name}
        detailItems={detailItems}
        showMessagesLink={false}
        messagesHref={undefined}
        messagesLabel={tCommon('bucketDetail.messages')}
        showPublicLink={false}
        publicHref={undefined}
        publicLabel={tCommon('bucketDetail.publicPage')}
        showSettingsLink={false}
        settingsHref={undefined}
        settingsLabel={tCommon('bucketDetail.settings')}
        bucketsTitle={tCommon('bucketDetail.buckets')}
        bucketViewLabel={tCommon('bucketDetail.view')}
        bucketEditLabel={tCommon('bucketDetail.edit')}
        createBucketHref={createBucketHref}
        createBucketLabel={createBucketLabel}
        bucketsColumnName={tCommon('bucketDetail.name')}
        bucketsColumnLastMessage={tCommon('bucketDetail.lastMessage')}
        bucketsColumnCreated={tCommon('bucketDetail.created')}
        bucketsColumnPublic={tCommon('bucketDetail.isPublic')}
        bucketsColumnActions={tCommon('bucketDetail.actions')}
        bucketsEmptyMessage={tCommon('bucketDetail.noBucketsYet')}
        bucketsSortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
        wrapInContainer={false}
      />
    </BucketDetailPageLayout>
  );
}
