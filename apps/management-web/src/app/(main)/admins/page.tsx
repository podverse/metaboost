import type { ManagementUser } from '../../../types/management-api';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { request } from '@metaboost/helpers-requests';
import { FilterTablePageLayout, Stack } from '@metaboost/ui';

import { AdminsTableWithFilter } from '../../../components/AdminsTableWithFilter';
import { getManagementApiBaseUrl, getServerManagementApiBaseUrl } from '../../../config/env';
import { TABLE_SORT_PREFS_COOKIE_NAME } from '../../../lib/cookies';
import { getCrudFlags, hasReadPermission } from '../../../lib/main-nav';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { getCookieHeader, parseFilterColumns } from '../../../lib/server-request';

type AdminsResponse = {
  admins: ManagementUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

async function fetchAdmins(
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<{ data: AdminsResponse | null; error: string | null }> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (limit !== DEFAULT_PAGE_LIMIT) params.set('limit', String(limit));
  if (search !== undefined && search !== '') params.set('search', search);
  if (sortBy !== undefined && sortBy.trim() !== '') params.set('sortBy', sortBy.trim());
  if (sortOrder === 'asc' || sortOrder === 'desc') params.set('sortOrder', sortOrder);
  const query = params.toString();
  const path = query ? `${ROUTES.ADMINS}?${query}` : ROUTES.ADMINS;

  try {
    const res = await request(baseUrl, path, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { data: null, error: 'Failed to load admins' };
    }

    const data = res.data as AdminsResponse | undefined;
    if (
      data === undefined ||
      !Array.isArray(data.admins) ||
      typeof data.total !== 'number' ||
      typeof data.page !== 'number' ||
      typeof data.totalPages !== 'number'
    ) {
      return { data: null, error: null };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to load admins' };
  }
}

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    filterColumns?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

export default async function AdminsPage({ searchParams }: PageProps) {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const canReadAdmins =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'adminsCrud');
  if (!canReadAdmins) {
    redirect(ROUTES.DASHBOARD);
  }

  const resolved = searchParams !== undefined ? await searchParams : {};
  const page = Math.max(1, Number(resolved.page) || 1);
  const limit = DEFAULT_PAGE_LIMIT;
  const adminColumnIds = ['email', 'displayName'];
  const effectiveFilterColumns = parseFilterColumns(resolved, adminColumnIds);
  const search = resolved.search ?? '';
  const sortBy = resolved.sortBy?.trim();
  const sortOrder =
    resolved.sortOrder === 'asc' || resolved.sortOrder === 'desc' ? resolved.sortOrder : undefined;

  const tCommon = await getTranslations('common');
  const { data, error } = await fetchAdmins(
    page,
    limit,
    search === '' ? undefined : search,
    sortBy,
    sortOrder
  );

  const admins = data?.admins ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;

  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'adminsCrud');
  const apiBaseUrl = getManagementApiBaseUrl();

  const tableRows = admins.map((a) => ({
    id: a.id,
    cells: {
      username: a.username,
      displayName: a.displayName !== null && a.displayName !== '' ? a.displayName : '—',
    },
    isSuperAdmin: a.isSuperAdmin === true,
  }));

  const adminColumns = [
    { id: 'username', label: tCommon('adminsTable.username'), defaultSortOrder: 'asc' as const },
    {
      id: 'displayName',
      label: tCommon('adminsTable.displayName'),
      defaultSortOrder: 'asc' as const,
    },
  ];

  const currentQueryParams: Record<string, string> = {};
  if (page > 1) currentQueryParams.page = String(page);
  if ((resolved.filterColumns ?? '').trim() !== '')
    currentQueryParams.filterColumns = resolved.filterColumns ?? '';
  if (search !== '') currentQueryParams.search = search;
  if (sortBy !== undefined && sortBy !== '') currentQueryParams.sortBy = sortBy;
  if (sortOrder !== undefined) currentQueryParams.sortOrder = sortOrder;

  return (
    <FilterTablePageLayout
      title={tCommon('admins')}
      error={error !== null ? error : undefined}
      errorVariant="error"
    >
      {error === null && (
        <Stack>
          <AdminsTableWithFilter
            tableRows={tableRows}
            emptyMessage={admins.length === 0 ? tCommon('noAdmins') : undefined}
            columns={adminColumns}
            initialFilterColumns={effectiveFilterColumns}
            initialSearch={search}
            basePath={ROUTES.ADMINS}
            currentQueryParams={currentQueryParams}
            currentPage={currentPage}
            totalPages={totalPages}
            limit={limit}
            defaultLimit={DEFAULT_PAGE_LIMIT}
            maxGoToPage={500}
            canViewAdmin={crud.read}
            canUpdateAdmin={crud.update}
            canDeleteAdmin={crud.delete}
            adminApiBaseUrl={apiBaseUrl}
            currentUserId={user.id}
            addAdminHref={crud.create ? ROUTES.ADMINS_NEW : undefined}
            sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
            sortPrefsListKey="admins"
          />
        </Stack>
      )}
    </FilterTablePageLayout>
  );
}
