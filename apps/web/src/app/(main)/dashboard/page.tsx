import type { BucketType } from '@metaboost/helpers-requests';

import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { Container } from '@metaboost/ui';

import { BucketsTableWithFilter } from '../../../components/BucketsTableWithFilter';
import { BucketSummaryPanel } from '../../../components/BucketSummaryPanel';
import { fetchDashboardBucketSummary } from '../../../lib/buckets';
import {
  buildInitialBucketSummaryApiQuery,
  resolveInitialBucketSummaryPref,
} from '../../../lib/bucketSummaryPrefs';
import {
  BUCKET_SUMMARY_PREFS_COOKIE_NAME,
  TABLE_SORT_PREFS_COOKIE_NAME,
} from '../../../lib/cookies';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { getCookieHeader, getServerApiBaseUrl } from '../../../lib/server-request';

type Bucket = {
  id: string;
  shortId: string;
  ownerId: string;
  name: string;
  type: BucketType;
  isPublic: boolean;
};

async function fetchBuckets(): Promise<Bucket[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await request<{ buckets?: Bucket[] }>(baseUrl, '/buckets', {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined || !Array.isArray(res.data.buckets)) {
    return [];
  }
  return res.data.buckets;
}

function getBucketTypeLabel(
  t: Awaited<ReturnType<typeof getTranslations>>,
  bucketType: Bucket['type']
): string {
  if (bucketType === 'rss-channel') return t('bucketTypeRssChannel');
  if (bucketType === 'rss-network') return t('bucketTypeRssNetwork');
  if (bucketType === 'mb-root' || bucketType === 'mb-mid' || bucketType === 'mb-leaf') {
    return t('bucketTypeCustom');
  }
  return t('bucketTypeRssItem');
}

type DashboardSearchParams = {
  filterColumns?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<DashboardSearchParams>;
}) {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const resolved = searchParams !== undefined ? await searchParams : {};
  const cookieStore = await cookies();
  const initialPref = resolveInitialBucketSummaryPref(
    cookieStore.get(BUCKET_SUMMARY_PREFS_COOKIE_NAME)?.value,
    ROUTES.DASHBOARD
  );
  const initialSummaryQuery = buildInitialBucketSummaryApiQuery(
    initialPref,
    user.preferredCurrency ?? undefined
  );
  const tBuckets = await getTranslations('buckets');
  const [buckets, initialSummary] = await Promise.all([
    fetchBuckets(),
    fetchDashboardBucketSummary(initialSummaryQuery),
  ]);
  const tableRows = buckets.map((b) => ({
    id: b.shortId,
    cells: {
      name: b.name,
      isPublic: b.isPublic ? tBuckets('publicYes') : tBuckets('publicNo'),
      type: getBucketTypeLabel(tBuckets, b.type),
    },
  }));
  const columns = [
    { id: 'name', label: tBuckets('name'), defaultSortOrder: 'asc' as const },
    { id: 'isPublic', label: tBuckets('isPublic'), defaultSortOrder: 'asc' as const },
    { id: 'type', label: tBuckets('type') },
  ];
  const currentQueryParams: Record<string, string> = {};
  if ((resolved.filterColumns ?? '').trim() !== '') {
    currentQueryParams.filterColumns = resolved.filterColumns ?? '';
  }
  if ((resolved.search ?? '').trim() !== '') {
    currentQueryParams.search = resolved.search ?? '';
  }
  if ((resolved.sortBy ?? '').trim() !== '') {
    currentQueryParams.sortBy = resolved.sortBy ?? '';
  }
  if (resolved.sortOrder === 'asc' || resolved.sortOrder === 'desc') {
    currentQueryParams.sortOrder = resolved.sortOrder;
  }

  return (
    <Container>
      <BucketSummaryPanel
        scope="dashboard"
        initialSummary={initialSummary}
        initialPref={initialPref}
      />
      <BucketsTableWithFilter
        tableRows={tableRows}
        emptyMessage={buckets.length === 0 ? tBuckets('noBuckets') : undefined}
        columns={columns}
        initialFilterColumns={['name']}
        initialSearch=""
        basePath={ROUTES.DASHBOARD}
        currentQueryParams={currentQueryParams}
        addBucketHref={ROUTES.BUCKETS_NEW}
        filterableColumnIds={['name']}
        sortableColumnIds={['name', 'isPublic']}
        sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
        sortPrefsListKey="dashboard-buckets"
      />
    </Container>
  );
}
