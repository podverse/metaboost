import type { PublicBucket, PublicBucketMessage } from '@boilerplate/helpers-requests';
import type { BreadcrumbItem } from '@boilerplate/ui';
import type { BucketMessageListItem } from '@boilerplate/ui';

import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { DEFAULT_PAGE_LIMIT } from '@boilerplate/helpers';
import { webBuckets } from '@boilerplate/helpers-requests';
import {
  BucketMessageList,
  ButtonLink,
  ContentPageLayout,
  Divider,
  getMessagesSortFromCookieValue,
  Pagination,
  SectionWithHeading,
  Stack,
} from '@boilerplate/ui';

import { TABLE_SORT_PREFS_COOKIE_NAME } from '../../../../lib/cookies';
import { publicBucketRoute, publicBucketSubmitRoute } from '../../../../lib/routes';
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
        <ButtonLink href={publicBucketSubmitRoute(id)} variant="primary">
          Submit a message
        </ButtonLink>
        <Divider />
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
