'use client';

import type { ManagementUser } from '../../types/management-api';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { request } from '@metaboost/helpers-requests';
import { getSortPrefsFromCookie, getTableListStateEntryFromCookie } from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';
import { parseFilterColumns } from '../parseFilterColumns';
import { ROUTES } from '../routes';

type AdminsResponse = {
  admins: ManagementUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminsTableClientSnapshot = {
  tableRows: Array<{ id: string; cells: Record<string, string>; isSuperAdmin?: boolean }>;
  currentQueryParams: Record<string, string>;
  initialSearch: string;
  initialFilterColumns: string[];
  currentPage: number;
  totalPages: number;
};

export async function fetchAdminsTableFromCookies(args: {
  sortPrefsCookieName: string;
  tableListStateCookieName: string;
}): Promise<AdminsTableClientSnapshot | null> {
  const listState = getTableListStateEntryFromCookie(args.tableListStateCookieName, 'admins');
  const cookieSort = getSortPrefsFromCookie(args.sortPrefsCookieName, 'admins');
  const page = Math.max(1, listState?.page ?? 1);
  const limit = DEFAULT_PAGE_LIMIT;
  const adminColumnIds = ['email', 'displayName'];
  const mergedFilterColumns = listState?.filterColumns;
  const effectiveFilterColumns = parseFilterColumns(
    { filterColumns: mergedFilterColumns },
    adminColumnIds
  );
  const search = listState?.search ?? '';
  const sortBy = cookieSort?.sortBy;
  const sortOrder = cookieSort?.sortOrder;

  const baseUrl = getManagementApiBaseUrl();
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (limit !== DEFAULT_PAGE_LIMIT) params.set('limit', String(limit));
  if (search.trim() !== '') params.set('search', search.trim());
  if (sortBy !== undefined && sortBy.trim() !== '') params.set('sortBy', sortBy.trim());
  if (sortOrder === 'asc' || sortOrder === 'desc') params.set('sortOrder', sortOrder);
  const query = params.toString();
  const path = query !== '' ? `${ROUTES.ADMINS}?${query}` : ROUTES.ADMINS;

  const res = await request<AdminsResponse>(baseUrl, path, {});
  if (!res.ok || res.data === undefined) return null;
  const data = res.data;
  if (
    !Array.isArray(data.admins) ||
    typeof data.totalPages !== 'number' ||
    typeof data.page !== 'number'
  ) {
    return null;
  }

  const tableRows = data.admins.map((a) => ({
    id: a.id,
    cells: {
      username: a.username,
      displayName: a.displayName !== null && a.displayName !== '' ? a.displayName : '—',
    },
    isSuperAdmin: a.isSuperAdmin === true,
  }));

  const currentQueryParams: Record<string, string> = {};
  if (page > 1) currentQueryParams.page = String(page);
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
    currentPage: data.page,
    totalPages: data.totalPages,
  };
}
