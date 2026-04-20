'use client';

import type { ListBucketsData } from '@metaboost/helpers-requests';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { request } from '@metaboost/helpers-requests';
import { getSortPrefsFromCookie, getTableListStateEntryFromCookie } from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';

export type BucketsTableClientSnapshot = {
  tableRows: Array<{ id: string; cells: Record<string, string> }>;
  currentQueryParams: Record<string, string>;
  initialSearch: string;
};

export async function fetchBucketsTableFromCookies(args: {
  sortPrefsCookieName: string;
  tableListStateCookieName: string;
  visibilityYesLabel: string;
  visibilityNoLabel: string;
}): Promise<BucketsTableClientSnapshot | null> {
  const listState = getTableListStateEntryFromCookie(args.tableListStateCookieName, 'buckets');
  const cookieSort = getSortPrefsFromCookie(args.sortPrefsCookieName, 'buckets');
  const page = Math.max(1, listState?.page ?? 1);
  const limit = DEFAULT_PAGE_LIMIT;
  const search = listState?.search ?? '';
  const sortBy = cookieSort?.sortBy;
  const sortOrder = cookieSort?.sortOrder;

  const baseUrl = getManagementApiBaseUrl();
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search.trim() !== '') params.set('search', search.trim());
  if (sortBy !== undefined && sortBy.trim() !== '') params.set('sortBy', sortBy.trim());
  if (sortOrder === 'asc' || sortOrder === 'desc') params.set('sortOrder', sortOrder);
  const path = `/buckets?${params.toString()}`;

  const res = await request<ListBucketsData>(baseUrl, path, {});
  if (!res.ok || res.data === undefined || !Array.isArray(res.data.buckets)) return null;

  const tableRows = res.data.buckets.map((b) => ({
    id: b.shortId,
    cells: {
      name: b.name,
      isPublic: b.isPublic ? args.visibilityYesLabel : args.visibilityNoLabel,
    },
  }));

  const currentQueryParams: Record<string, string> = {};
  if (search !== '') currentQueryParams.search = search;
  if (page > 1) currentQueryParams.page = String(page);
  if (limit !== DEFAULT_PAGE_LIMIT) currentQueryParams.limit = String(limit);
  if (sortBy !== undefined && sortBy !== '') currentQueryParams.sortBy = sortBy;
  if (sortOrder !== undefined) currentQueryParams.sortOrder = sortOrder;

  return {
    tableRows,
    currentQueryParams,
    initialSearch: search,
  };
}
