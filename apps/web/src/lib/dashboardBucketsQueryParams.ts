'use client';

import { getSortPrefsFromCookie, getTableListStateEntryFromCookie } from '@metaboost/ui';

export function buildDashboardBucketsCurrentQueryParams(args: {
  sortPrefsCookieName: string;
  tableListStateCookieName: string;
  listKey: string;
}): Record<string, string> {
  const listState = getTableListStateEntryFromCookie(args.tableListStateCookieName, args.listKey);
  const cookieSort = getSortPrefsFromCookie(args.sortPrefsCookieName, args.listKey);
  const qp: Record<string, string> = {};
  const filterCols = listState?.filterColumns?.trim();
  if (filterCols !== undefined && filterCols !== '') {
    qp.filterColumns = filterCols;
  }
  const search = listState?.search?.trim();
  if (search !== undefined && search !== '') {
    qp.search = search;
  }
  if (cookieSort !== null) {
    qp.sortBy = cookieSort.sortBy;
    qp.sortOrder = cookieSort.sortOrder;
  }
  return qp;
}
