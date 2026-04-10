import type { MainAppUser } from '../../../types/management-api';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { request } from '@boilerplate/helpers-requests';
import { FilterTablePageLayout, Stack } from '@boilerplate/ui';

import { UsersTableWithFilter } from '../../../components/UsersTableWithFilter';
import { getManagementApiBaseUrl, getServerManagementApiBaseUrl } from '../../../config/env';
import { TABLE_SORT_PREFS_COOKIE_NAME } from '../../../lib/cookies';
import { getCrudFlags, hasReadPermission } from '../../../lib/main-nav';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { getCookieHeader, parseFilterColumns } from '../../../lib/server-request';

type UsersResponse = {
  users: MainAppUser[];
};

async function fetchUsers(
  search?: string,
  filterColumns?: string[],
  sortBy?: string,
  sortOrder?: string
): Promise<{ data: UsersResponse | null; error: string | null }> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const params = new URLSearchParams();
  if (search !== undefined && search.trim() !== '') params.set('search', search.trim());
  if (
    filterColumns !== undefined &&
    filterColumns.length > 0 &&
    search !== undefined &&
    search.trim() !== ''
  ) {
    params.set('filterColumns', filterColumns.join(','));
  }
  if (sortBy !== undefined && sortBy.trim() !== '') params.set('sortBy', sortBy.trim());
  if (sortOrder === 'asc' || sortOrder === 'desc') params.set('sortOrder', sortOrder);
  const path = params.toString() !== '' ? `/users?${params.toString()}` : '/users';
  try {
    const res = await request(baseUrl, path, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { data: null, error: 'Failed to load users' };
    }

    const data = res.data as UsersResponse | undefined;
    if (data === undefined || !Array.isArray(data.users)) {
      return { data: null, error: null };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to load users' };
  }
}

type PageProps = {
  searchParams?: Promise<{
    filterColumns?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const canReadUsers =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'usersCrud');
  if (!canReadUsers) {
    redirect(ROUTES.DASHBOARD);
  }

  const resolved = searchParams !== undefined ? await searchParams : {};
  const userColumnIds = ['email', 'displayName'];
  const effectiveFilterColumns = parseFilterColumns(resolved, userColumnIds);
  const search = resolved.search ?? '';
  const sortBy = resolved.sortBy?.trim();
  const sortOrder =
    resolved.sortOrder === 'asc' || resolved.sortOrder === 'desc' ? resolved.sortOrder : undefined;

  const tCommon = await getTranslations('common');
  const { data, error } = await fetchUsers(search, effectiveFilterColumns, sortBy, sortOrder);

  const users = data?.users ?? [];
  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'usersCrud');
  const apiBaseUrl = getManagementApiBaseUrl();

  const tableRows = users.map((u) => ({
    id: u.id,
    cells: {
      email: u.email !== null && u.email !== '' ? u.email : '—',
      displayName: u.displayName !== null && u.displayName !== '' ? u.displayName : '—',
    },
  }));

  const userColumns = [
    { id: 'email', label: tCommon('usersTable.email'), defaultSortOrder: 'asc' as const },
    {
      id: 'displayName',
      label: tCommon('usersTable.displayName'),
      defaultSortOrder: 'asc' as const,
    },
  ];

  const currentQueryParams: Record<string, string> = {};
  if ((resolved.filterColumns ?? '').trim() !== '')
    currentQueryParams.filterColumns = resolved.filterColumns ?? '';
  if (search !== '') currentQueryParams.search = search;
  if (sortBy !== undefined && sortBy !== '') currentQueryParams.sortBy = sortBy;
  if (sortOrder !== undefined) currentQueryParams.sortOrder = sortOrder;

  return (
    <FilterTablePageLayout
      title={tCommon('users')}
      error={error !== null ? tCommon('failedToLoadUsers') : undefined}
      errorVariant="error"
    >
      {error === null && (
        <Stack>
          <UsersTableWithFilter
            tableRows={tableRows}
            emptyMessage={users.length === 0 ? tCommon('noUsers') : undefined}
            columns={userColumns}
            initialFilterColumns={effectiveFilterColumns}
            initialSearch={search}
            basePath={ROUTES.USERS}
            currentQueryParams={currentQueryParams}
            filterableColumnIds={['email', 'displayName']}
            canViewUser={crud.read}
            canUpdateUser={crud.update}
            canDeleteUser={crud.delete}
            userApiBaseUrl={apiBaseUrl}
            addUserHref={crud.create ? ROUTES.USERS_NEW : undefined}
            sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
            sortPrefsListKey="users"
          />
        </Stack>
      )}
    </FilterTablePageLayout>
  );
}
