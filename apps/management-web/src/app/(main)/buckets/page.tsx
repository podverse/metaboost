import type { ListBucketsData } from '@metaboost/helpers-requests';

import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import {
  FilterTablePageLayout,
  getSortPrefsFromCookieValue,
  getTableListStateEntryFromCookieValue,
  Stack,
} from '@metaboost/ui';

import { BucketsTableWithFilter } from '../../../components/BucketsTableWithFilter';
import { getManagementApiBaseUrl, getServerManagementApiBaseUrl } from '../../../config/env';
import { TABLE_LIST_STATE_COOKIE_NAME, TABLE_SORT_PREFS_COOKIE_NAME } from '../../../lib/cookies';
import { getCrudFlags, hasReadPermission } from '../../../lib/main-nav';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { getCookieHeader } from '../../../lib/server-request';

async function fetchBuckets(
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<{ data: ListBucketsData | null; error: string | null }> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search !== undefined && search.trim() !== '') params.set('search', search.trim());
  if (sortBy !== undefined && sortBy.trim() !== '') params.set('sortBy', sortBy.trim());
  if (sortOrder === 'asc' || sortOrder === 'desc') params.set('sortOrder', sortOrder);
  const path = `/buckets?${params.toString()}`;
  try {
    const res = await request(baseUrl, path, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return { data: null, error: 'Failed to load buckets' };
    const data = res.data as ListBucketsData | undefined;
    if (data === undefined || !Array.isArray(data.buckets)) return { data: null, error: null };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to load buckets' };
  }
}

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

export default async function BucketsPage({ searchParams }: PageProps) {
  const user = await getServerUser();

  if (user === null) redirect(ROUTES.LOGIN);

  if (!user.isSuperAdmin && !hasReadPermission(user.permissions, 'bucketsCrud')) {
    redirect(ROUTES.DASHBOARD);
  }

  const resolved = searchParams !== undefined ? await searchParams : {};
  const cookieStore = await cookies();
  const sortPrefsRaw = cookieStore.get(TABLE_SORT_PREFS_COOKIE_NAME)?.value;
  const listState = getTableListStateEntryFromCookieValue(
    cookieStore.get(TABLE_LIST_STATE_COOKIE_NAME)?.value,
    'buckets'
  );
  const cookieSort = getSortPrefsFromCookieValue(sortPrefsRaw, 'buckets');
  const page =
    resolved.page !== undefined && String(resolved.page).trim() !== ''
      ? Math.max(1, Number(resolved.page) || 1)
      : Math.max(1, listState?.page ?? 1);
  const limit = Math.min(100, Math.max(1, Number(resolved.limit) || 20));
  const search =
    resolved.search !== undefined && resolved.search !== ''
      ? resolved.search
      : (listState?.search ?? '');
  const sortBy =
    resolved.sortBy !== undefined && resolved.sortBy.trim() !== ''
      ? resolved.sortBy.trim()
      : cookieSort?.sortBy;
  const sortOrder =
    resolved.sortOrder === 'asc' || resolved.sortOrder === 'desc'
      ? resolved.sortOrder
      : cookieSort?.sortOrder;

  const tCommon = await getTranslations('common');
  const { data, error } = await fetchBuckets(page, limit, search, sortBy, sortOrder);

  const buckets = data?.buckets ?? [];
  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'bucketsCrud');
  const apiBaseUrl = getManagementApiBaseUrl();

  const tableRows = buckets.map((b) => ({
    id: b.shortId,
    cells: {
      name: b.name,
      isPublic: b.isPublic
        ? tCommon('usersTable.visibilityYes')
        : tCommon('usersTable.visibilityNo'),
    },
  }));

  const columns = [
    { id: 'name', label: tCommon('bucketsTable.name'), defaultSortOrder: 'asc' as const },
    { id: 'isPublic', label: tCommon('bucketsTable.isPublic'), defaultSortOrder: 'asc' as const },
  ];

  const currentQueryParams: Record<string, string> = {};
  if (search !== '') currentQueryParams.search = search;
  if (page > 1) currentQueryParams.page = String(page);
  if (limit !== 20) currentQueryParams.limit = String(limit);
  if (sortBy !== undefined && sortBy !== '') currentQueryParams.sortBy = sortBy;
  if (sortOrder !== undefined) currentQueryParams.sortOrder = sortOrder;

  return (
    <FilterTablePageLayout
      title={tCommon('buckets')}
      error={error !== null ? tCommon('failedToLoadBuckets') : undefined}
      errorVariant="error"
    >
      {error === null && (
        <Stack>
          <BucketsTableWithFilter
            tableRows={tableRows}
            emptyMessage={buckets.length === 0 ? tCommon('noBuckets') : undefined}
            columns={columns}
            initialFilterColumns={['name']}
            initialSearch={search}
            basePath={ROUTES.BUCKETS}
            currentQueryParams={currentQueryParams}
            filterableColumnIds={['name']}
            canViewBucket={crud.read}
            canUpdateBucket={crud.update}
            canDeleteBucket={crud.delete}
            apiBaseUrl={apiBaseUrl}
            addBucketHref={crud.create ? ROUTES.BUCKETS_NEW : undefined}
            sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
            sortPrefsListKey="buckets"
            tableListStateCookieName={TABLE_LIST_STATE_COOKIE_NAME}
          />
        </Stack>
      )}
    </FilterTablePageLayout>
  );
}
