'use client';

import type { FilterableTableRow } from '@metaboost/ui';

import { DEFAULT_PAGE_LIMIT } from '@metaboost/helpers';
import { formatDateTimeReadable } from '@metaboost/helpers-i18n/client';
import { request } from '@metaboost/helpers-requests';
import { getSortPrefsFromCookie, getTableListStateEntryFromCookie } from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';
import { ROUTES } from '../routes';

type EventItem = {
  id: string;
  actorId: string;
  actorType: string;
  actorDisplayName?: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  timestamp: string;
  details: string | null;
};

type EventsResponse = {
  events: EventItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type EventsTableClientSnapshot = {
  tableRows: FilterableTableRow[];
  currentQueryParams: Record<string, string>;
  initialSearch: string;
  initialFilterColumns: string[];
  sort: string;
  currentPage: number;
  totalPages: number;
};

export async function fetchEventsTableFromCookies(args: {
  sortPrefsCookieName: string;
  tableListStateCookieName: string;
  locale: string;
}): Promise<EventsTableClientSnapshot | null> {
  const listState = getTableListStateEntryFromCookie(args.tableListStateCookieName, 'events');
  const cookieSort = getSortPrefsFromCookie(args.sortPrefsCookieName, 'events');
  const page = Math.max(1, listState?.page ?? 1);
  const limit = DEFAULT_PAGE_LIMIT;
  const sort = listState?.timelineSort === 'oldest' ? 'oldest' : 'recent';
  const sortBy = cookieSort?.sortBy;
  const sortOrder = cookieSort?.sortOrder;
  const filterColumnsRaw = listState?.filterColumns ?? '';
  const eventColumnIds = ['actor', 'action', 'target', 'details'];
  const initialFilterColumns =
    filterColumnsRaw.trim() === ''
      ? eventColumnIds
      : filterColumnsRaw
          .split(',')
          .map((s) => s.trim())
          .filter((id) => eventColumnIds.includes(id));
  const effectiveFilterColumns =
    initialFilterColumns.length > 0 ? initialFilterColumns : eventColumnIds;
  const search = listState?.search ?? '';

  const baseUrl = getManagementApiBaseUrl();
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (limit !== DEFAULT_PAGE_LIMIT) params.set('limit', String(limit));
  if (sort === 'oldest') params.set('sort', 'oldest');
  if (sortBy !== undefined && sortBy.trim() !== '') params.set('sortBy', sortBy.trim());
  if (sortOrder === 'asc' || sortOrder === 'desc') params.set('sortOrder', sortOrder);
  if (search.trim() !== '') params.set('search', search.trim());
  const query = params.toString();
  const path = query !== '' ? `${ROUTES.EVENTS}?${query}` : ROUTES.EVENTS;

  const res = await request<EventsResponse>(baseUrl, path, {});
  if (!res.ok || res.data === undefined) return null;
  const data = res.data;
  if (
    !Array.isArray(data.events) ||
    typeof data.totalPages !== 'number' ||
    typeof data.page !== 'number'
  ) {
    return null;
  }

  const tableRows = data.events.map((e) => {
    const actorName =
      e.actorDisplayName !== undefined && e.actorDisplayName !== null && e.actorDisplayName !== ''
        ? `${e.actorDisplayName} (${e.actorType})`
        : `${e.actorId} (${e.actorType})`;
    return {
      id: e.id,
      cells: {
        timestamp: formatDateTimeReadable(args.locale, e.timestamp),
        actor: actorName,
        action: e.action,
        target:
          [e.targetType, e.targetId]
            .filter((x) => x !== null && x !== undefined && x !== '')
            .join(' — ') || '—',
        details: e.details !== null && e.details !== '' ? e.details : '—',
      },
    };
  });

  const currentQueryParams: Record<string, string> = {};
  if (page > 1) currentQueryParams.page = String(page);
  if (sort === 'oldest') currentQueryParams.sort = 'oldest';
  if (sortBy !== undefined && sortBy !== '') currentQueryParams.sortBy = sortBy;
  if (sortOrder !== undefined) currentQueryParams.sortOrder = sortOrder;
  if (filterColumnsRaw.trim() !== '') currentQueryParams.filterColumns = filterColumnsRaw;
  if (search !== '') currentQueryParams.search = search;

  return {
    tableRows,
    currentQueryParams,
    initialSearch: search,
    initialFilterColumns: effectiveFilterColumns,
    sort,
    currentPage: data.page,
    totalPages: data.totalPages,
  };
}
