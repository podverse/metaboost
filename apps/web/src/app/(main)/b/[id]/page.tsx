import type { PublicBucket, PublicBucketMessage } from '@metaboost/helpers-requests';
import type { BreadcrumbItem } from '@metaboost/ui';
import type { BucketMessageListItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { webBuckets } from '@metaboost/helpers-requests';
import {
  BucketMessageList,
  ContentPageLayout,
  getMessagesSortFromCookieValue,
  Pagination,
  SectionWithHeading,
  Stack,
} from '@metaboost/ui';

import { TABLE_SORT_PREFS_COOKIE_NAME } from '../../../../lib/cookies';
import { publicBucketRoute } from '../../../../lib/routes';
import { getServerApiBaseUrl } from '../../../../lib/server-request';
import { MessagesSortSelect } from '../../bucket/[id]/MessagesSortSelect';
import { PublicBucketBreadcrumbs } from './PublicBucketBreadcrumbs';

async function fetchPublicBucket(id: string): Promise<PublicBucket | null> {
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchPublicBucket(baseUrl, id);
  if (!res.ok || res.data === undefined) return null;
  const bucket = res.data.bucket;
  return bucket !== undefined && typeof bucket?.id === 'string' ? bucket : null;
}

async function fetchPublicMessagesPaginated(
  id: string,
  page: number,
  limit: number,
  sort: 'recent' | 'oldest'
): Promise<{
  messages: PublicBucketMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchPublicBucketMessages(baseUrl, id, {
    page,
    limit,
    sort,
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

function buildMessageMetadataItems(
  t: Awaited<ReturnType<typeof getTranslations>>,
  message: PublicBucketMessage
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

export default async function PublicBucketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedSearchParams.page ?? '1', 10) || 1);
  const sort = resolvedSearchParams.sort === 'oldest' ? 'oldest' : 'recent';

  // Server redirect from cookie so first paint has correct sort (no flash).
  if (resolvedSearchParams.sort === undefined) {
    const cookieStore = await cookies();
    const sortPrefsCookieValue = cookieStore.get(TABLE_SORT_PREFS_COOKIE_NAME)?.value;
    const savedSort = getMessagesSortFromCookieValue(sortPrefsCookieValue);
    if (savedSort === 'oldest') {
      const queryParams = new URLSearchParams();
      queryParams.set('sort', 'oldest');
      if (page > 1) queryParams.set('page', String(page));
      redirect(`${publicBucketRoute(id)}?${queryParams.toString()}`);
    }
  }

  const bucket = await fetchPublicBucket(id);
  if (bucket === null || !bucket.isPublic) {
    notFound();
  }

  const messagesResult = await fetchPublicMessagesPaginated(id, page, DEFAULT_PAGE_LIMIT, sort);
  const t = await getTranslations('buckets');
  const listItems: BucketMessageListItem[] = messagesResult.messages.map((m) => ({
    id: m.id,
    senderName: m.senderName,
    body: m.body,
    isPublic: m.isPublic,
    createdAt: m.createdAt,
    metadataItems: buildMessageMetadataItems(t, m),
  }));

  const ancestors = bucket.ancestors ?? [];
  const showBreadcrumbs = ancestors.length > 0;
  const breadcrumbItems: BreadcrumbItem[] = showBreadcrumbs
    ? [
        ...ancestors.map((a) => ({ label: a.name, href: publicBucketRoute(a.shortId) })),
        { label: bucket.name, href: undefined },
      ]
    : [];

  const basePath = publicBucketRoute(id);

  return (
    <ContentPageLayout
      title={bucket.name}
      breadcrumbs={
        showBreadcrumbs ? <PublicBucketBreadcrumbs items={breadcrumbItems} /> : undefined
      }
      contentMaxWidth="readable"
    >
      <Stack>
        <SectionWithHeading
          title={t('messages')}
          headingAction={
            <MessagesSortSelect
              sort={sort}
              basePath={basePath}
              label={t('messagesSort.label')}
              sortOptionLabels={{
                recent: t('messagesSortOptions.recent'),
                oldest: t('messagesSortOptions.oldest'),
              }}
              sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
            />
          }
        >
          <BucketMessageList
            messages={listItems}
            variant="public"
            emptyMessage={t('noPublicMessagesYet')}
          />
          {messagesResult.totalPages > 1 ? (
            <Pagination
              currentPage={messagesResult.page}
              totalPages={messagesResult.totalPages}
              basePath={basePath}
              limit={messagesResult.limit}
              defaultLimit={DEFAULT_PAGE_LIMIT}
              queryParams={sort === 'oldest' ? { sort: 'oldest' } : undefined}
            />
          ) : null}
        </SectionWithHeading>
      </Stack>
    </ContentPageLayout>
  );
}
