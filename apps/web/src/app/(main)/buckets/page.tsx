import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { FilterTablePageLayout } from '@metaboost/ui';

import { BucketsTableWithFilter } from '../../../components/BucketsTableWithFilter';
import { TABLE_SORT_PREFS_COOKIE_NAME } from '../../../lib/cookies';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import {
  getCookieHeader,
  getServerApiBaseUrl,
  parseFilterColumns,
} from '../../../lib/server-request';

export const dynamic = 'force-dynamic';

export type Bucket = {
  id: string;
  shortId: string;
  ownerId: string;
  name: string;
  type: 'rss-network' | 'rss-channel' | 'rss-item';
  slug: string;
  isPublic: boolean;
  parentBucketId: string | null;
  createdAt: string;
  updatedAt: string;
};

type BucketsResponse = { buckets: Bucket[] };

async function fetchBuckets(
  search?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<{ data: BucketsResponse | null; error: string | null }> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const params = new URLSearchParams();
  if (search !== undefined && search.trim() !== '') params.set('search', search.trim());
  if (sortBy !== undefined && sortBy.trim() !== '') params.set('sortBy', sortBy.trim());
  if (sortOrder === 'asc' || sortOrder === 'desc') params.set('sortOrder', sortOrder);
  const path = params.toString() !== '' ? `/buckets?${params.toString()}` : '/buckets';
  try {
    const res = await request(baseUrl, path, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { data: null, error: 'Failed to load buckets' };
    }
    const data = res.data as BucketsResponse | undefined;
    if (data === undefined || !Array.isArray(data.buckets)) {
      return { data: null, error: null };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to load buckets' };
  }
}

function getBucketTypeLabel(
  t: Awaited<ReturnType<typeof getTranslations>>,
  bucketType: Bucket['type']
): string {
  if (bucketType === 'rss-channel') {
    return t('bucketTypeRssChannel');
  }
  if (bucketType === 'rss-network') {
    return t('bucketTypeRssNetwork');
  }
  return t('bucketTypeRssItem');
}

type PageProps = {
  searchParams?: Promise<{
    filterColumns?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

export default async function BucketsPage({ searchParams }: PageProps) {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const t = await getTranslations('buckets');
  const resolved = searchParams !== undefined ? await searchParams : {};
  const bucketColumnIds = ['name'];
  const effectiveFilterColumns = parseFilterColumns(resolved, bucketColumnIds);
  const search = resolved.search ?? '';
  const sortBy = resolved.sortBy?.trim();
  const sortOrder =
    resolved.sortOrder === 'asc' || resolved.sortOrder === 'desc' ? resolved.sortOrder : undefined;

  const { data, error } = await fetchBuckets(search, sortBy, sortOrder);
  const buckets = data?.buckets ?? [];

  const tableRows = buckets.map((b) => ({
    id: b.shortId,
    cells: {
      name: b.name,
      isPublic: b.isPublic ? t('publicYes') : t('publicNo'),
      type: getBucketTypeLabel(t, b.type),
    },
  }));

  const columns = [
    { id: 'name', label: t('name'), defaultSortOrder: 'asc' as const },
    { id: 'isPublic', label: t('isPublic'), defaultSortOrder: 'asc' as const },
    { id: 'type', label: t('type') },
  ];

  const currentQueryParams: Record<string, string> = {};
  if ((resolved.filterColumns ?? '').trim() !== '')
    currentQueryParams.filterColumns = resolved.filterColumns ?? '';
  if (search !== '') currentQueryParams.search = search;
  if (sortBy !== undefined && sortBy !== '') currentQueryParams.sortBy = sortBy;
  if (sortOrder !== undefined) currentQueryParams.sortOrder = sortOrder;

  return (
    <FilterTablePageLayout
      title={t('title')}
      error={error !== null ? t('failedToLoad') : undefined}
    >
      {error === null && (
        <BucketsTableWithFilter
          tableRows={tableRows}
          emptyMessage={buckets.length === 0 ? t('noBuckets') : undefined}
          columns={columns}
          initialFilterColumns={effectiveFilterColumns}
          initialSearch={search}
          basePath={ROUTES.BUCKETS}
          currentQueryParams={currentQueryParams}
          addBucketHref={ROUTES.BUCKETS_NEW}
          filterableColumnIds={['name']}
          sortableColumnIds={['name', 'isPublic']}
          sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
          sortPrefsListKey="buckets"
        />
      )}
    </FilterTablePageLayout>
  );
}
