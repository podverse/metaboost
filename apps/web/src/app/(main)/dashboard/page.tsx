import type { BucketType } from '@metaboost/helpers-requests';

import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { webBuckets } from '@metaboost/helpers-requests';
import {
  Container,
  getSortPrefsFromCookieValue,
  getTableListStateEntryFromCookieValue,
} from '@metaboost/ui';

import { BucketsTableWithFilter } from '../../../components/BucketsTableWithFilter';
import { BucketSummaryPanel } from '../../../components/BucketSummaryPanel';
import { fetchDashboardBucketSummary } from '../../../lib/buckets';
import {
  buildInitialBucketSummaryApiQuery,
  resolveInitialBucketSummaryPref,
} from '../../../lib/bucketSummaryPrefs';
import { bucketTypeCellLabel } from '../../../lib/bucketTypeLabel';
import {
  BUCKET_SUMMARY_PREFS_COOKIE_NAME,
  TABLE_LIST_STATE_COOKIE_NAME,
  TABLE_SORT_PREFS_COOKIE_NAME,
} from '../../../lib/cookies';
import { mergedDashboardStateToTopLevelBucketsQuery } from '../../../lib/dashboardBucketsApiQuery';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { getCookieHeader, getServerApiBaseUrl } from '../../../lib/server-request';

type Bucket = {
  id: string;
  idText: string;
  ownerId: string;
  name: string;
  type: BucketType;
  isPublic: boolean;
};

async function fetchBuckets(args: {
  mergedSearch: string;
  mergedSortBy: string;
  mergedSortOrder: string;
}): Promise<Bucket[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const query = mergedDashboardStateToTopLevelBucketsQuery({
    mergedSearch: args.mergedSearch,
    mergedSortBy: args.mergedSortBy,
    mergedSortOrder: args.mergedSortOrder,
  });
  const res = await webBuckets.reqFetchBucketsList(baseUrl, cookieHeader, query);
  if (!res.ok || res.data === undefined || !Array.isArray(res.data.buckets)) {
    return [];
  }
  return res.data.buckets;
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
  const sortPrefsRaw = cookieStore.get(TABLE_SORT_PREFS_COOKIE_NAME)?.value;
  const listState = getTableListStateEntryFromCookieValue(
    cookieStore.get(TABLE_LIST_STATE_COOKIE_NAME)?.value,
    'dashboard-buckets'
  );
  const cookieSort = getSortPrefsFromCookieValue(sortPrefsRaw, 'dashboard-buckets');
  const initialPref = resolveInitialBucketSummaryPref(
    cookieStore.get(BUCKET_SUMMARY_PREFS_COOKIE_NAME)?.value,
    ROUTES.DASHBOARD
  );
  const initialSummaryQuery = buildInitialBucketSummaryApiQuery(
    initialPref,
    user.preferredCurrency ?? undefined
  );
  const tBuckets = await getTranslations('buckets');
  const mergedSearch =
    (resolved.search ?? '').trim() !== '' ? (resolved.search ?? '') : (listState?.search ?? '');
  const mergedFilterColumns =
    (resolved.filterColumns ?? '').trim() !== ''
      ? (resolved.filterColumns ?? '')
      : (listState?.filterColumns ?? '');
  const mergedSortBy =
    (resolved.sortBy ?? '').trim() !== '' ? (resolved.sortBy ?? '') : (cookieSort?.sortBy ?? '');
  const mergedSortOrder =
    resolved.sortOrder === 'asc' || resolved.sortOrder === 'desc'
      ? resolved.sortOrder
      : (cookieSort?.sortOrder ?? '');

  const [buckets, initialSummary] = await Promise.all([
    fetchBuckets({
      mergedSearch,
      mergedSortBy,
      mergedSortOrder,
    }),
    fetchDashboardBucketSummary(initialSummaryQuery),
  ]);
  const tableRows = buckets.map((b) => ({
    id: b.idText,
    cells: {
      name: b.name,
      isPublic: b.isPublic ? tBuckets('publicYes') : tBuckets('publicNo'),
      type: bucketTypeCellLabel(tBuckets, b.type),
    },
  }));
  const columns = [
    { id: 'name', label: tBuckets('name'), defaultSortOrder: 'asc' as const },
    { id: 'isPublic', label: tBuckets('isPublic'), defaultSortOrder: 'asc' as const },
    { id: 'type', label: tBuckets('type') },
  ];
  const currentQueryParams: Record<string, string> = {};
  if (mergedFilterColumns.trim() !== '') {
    currentQueryParams.filterColumns = mergedFilterColumns;
  }
  if (mergedSearch.trim() !== '') {
    currentQueryParams.search = mergedSearch;
  }
  if (mergedSortBy.trim() !== '') {
    currentQueryParams.sortBy = mergedSortBy;
  }
  if (mergedSortOrder !== '') {
    currentQueryParams.sortOrder = mergedSortOrder;
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
        emptyRowsMessage={tBuckets('noBuckets')}
        columns={columns}
        initialFilterColumns={['name']}
        initialSearch={mergedSearch}
        basePath={ROUTES.DASHBOARD}
        currentQueryParams={currentQueryParams}
        addBucketHref={ROUTES.BUCKETS_NEW}
        filterableColumnIds={['name']}
        sortableColumnIds={['name', 'isPublic']}
        sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
        sortPrefsListKey="dashboard-buckets"
        tableListStateCookieName={TABLE_LIST_STATE_COOKIE_NAME}
      />
    </Container>
  );
}
