'use client';

import type { MainAppUser } from '../../types/management-api';

import { request } from '@metaboost/helpers-requests';
import { getSortPrefsFromCookie, getTableListStateEntryFromCookie } from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';
import { parseFilterColumns } from '../parseFilterColumns';

type UsersResponse = {
  users: MainAppUser[];
};

export type UsersTableClientSnapshot = {
  tableRows: Array<{ id: string; cells: Record<string, string> }>;
  currentQueryParams: Record<string, string>;
  initialSearch: string;
  initialFilterColumns: string[];
};

export async function fetchUsersTableFromCookies(args: {
  sortPrefsCookieName: string;
  tableListStateCookieName: string;
}): Promise<UsersTableClientSnapshot | null> {
  const listState = getTableListStateEntryFromCookie(args.tableListStateCookieName, 'users');
  const cookieSort = getSortPrefsFromCookie(args.sortPrefsCookieName, 'users');
  const userColumnIds = ['email', 'displayName'];
  const mergedFilterColumns = listState?.filterColumns;
  const effectiveFilterColumns = parseFilterColumns(
    { filterColumns: mergedFilterColumns },
    userColumnIds
  );
  const search = listState?.search ?? '';
  const sortBy = cookieSort?.sortBy;
  const sortOrder = cookieSort?.sortOrder;

  const baseUrl = getManagementApiBaseUrl();
  const params = new URLSearchParams();
  if (search.trim() !== '') params.set('search', search.trim());
  if (effectiveFilterColumns.length > 0 && search.trim() !== '') {
    params.set('filterColumns', effectiveFilterColumns.join(','));
  }
  if (sortBy !== undefined && sortBy.trim() !== '') params.set('sortBy', sortBy.trim());
  if (sortOrder === 'asc' || sortOrder === 'desc') params.set('sortOrder', sortOrder);
  const query = params.toString();
  const path = query !== '' ? `/users?${query}` : '/users';

  const res = await request<UsersResponse>(baseUrl, path, {});
  if (!res.ok || res.data === undefined || !Array.isArray(res.data.users)) return null;

  const tableRows = res.data.users.map((u) => ({
    id: u.id,
    cells: {
      email: u.email !== null && u.email !== '' ? u.email : '—',
      displayName: u.displayName !== null && u.displayName !== '' ? u.displayName : '—',
    },
  }));

  const currentQueryParams: Record<string, string> = {};
  if ((mergedFilterColumns ?? '').trim() !== '') {
    currentQueryParams.filterColumns = mergedFilterColumns ?? '';
  }
  if (search !== '') currentQueryParams.search = search;
  if (sortBy !== undefined && sortBy !== '') currentQueryParams.sortBy = sortBy;
  if (sortOrder !== undefined) currentQueryParams.sortOrder = sortOrder;

  return {
    tableRows,
    currentQueryParams,
    initialSearch: search,
    initialFilterColumns: effectiveFilterColumns,
  };
}
