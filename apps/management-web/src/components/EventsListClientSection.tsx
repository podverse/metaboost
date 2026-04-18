'use client';

import type { FilterableTableRow, TableFilterBarColumn } from '@metaboost/ui';

import { useCallback, useEffect, useState } from 'react';

import { fetchEventsTableFromCookies } from '../lib/client/eventsListClient';
import { TABLE_LIST_STATE_COOKIE_NAME, TABLE_SORT_PREFS_COOKIE_NAME } from '../lib/cookies';
import { EventsSortSelect } from './EventsSortSelect';
import { EventsTableWithFilter } from './EventsTableWithFilter';

export type EventsListClientSectionProps = {
  locale: string;
  tableRows: FilterableTableRow[];
  emptyMessage?: string;
  columns: TableFilterBarColumn[];
  initialFilterColumns: string[];
  initialSearch: string;
  basePath: string;
  currentQueryParams: Record<string, string>;
  currentPage: number;
  totalPages: number;
  limit: number;
  defaultLimit: number;
  sort: string;
  maxGoToPage?: number;
  filterableColumnIds?: string[];
  sortTimelineLabel: string;
  sortOptionLabels: { recent: string; oldest: string };
};

export function EventsListClientSection({
  locale,
  tableRows: initialTableRows,
  emptyMessage,
  columns,
  initialFilterColumns: initialFilterColumnsProp,
  initialSearch: initialSearchProp,
  basePath,
  currentQueryParams: initialQp,
  currentPage: initialPage,
  totalPages: initialTotalPages,
  limit,
  defaultLimit,
  sort: initialSort,
  maxGoToPage,
  filterableColumnIds,
  sortTimelineLabel,
  sortOptionLabels,
}: EventsListClientSectionProps) {
  const [tableRows, setTableRows] = useState(initialTableRows);
  const [currentQueryParams, setCurrentQueryParams] = useState(initialQp);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [initialSearch, setInitialSearch] = useState(initialSearchProp);
  const [initialFilterColumns, setInitialFilterColumns] = useState(initialFilterColumnsProp);
  const [sort, setSort] = useState(initialSort);

  useEffect(() => {
    setTableRows(initialTableRows);
    setCurrentQueryParams(initialQp);
    setCurrentPage(initialPage);
    setTotalPages(initialTotalPages);
    setInitialSearch(initialSearchProp);
    setInitialFilterColumns(initialFilterColumnsProp);
    setSort(initialSort);
  }, [
    initialTableRows,
    initialQp,
    initialPage,
    initialTotalPages,
    initialSearchProp,
    initialFilterColumnsProp,
    initialSort,
  ]);

  const onListMetadataChange = useCallback(async () => {
    const snap = await fetchEventsTableFromCookies({
      sortPrefsCookieName: TABLE_SORT_PREFS_COOKIE_NAME,
      tableListStateCookieName: TABLE_LIST_STATE_COOKIE_NAME,
      locale,
    });
    if (snap === null) return;
    setTableRows(snap.tableRows);
    setCurrentQueryParams(snap.currentQueryParams);
    setCurrentPage(snap.currentPage);
    setTotalPages(snap.totalPages);
    setInitialSearch(snap.initialSearch);
    setInitialFilterColumns(snap.initialFilterColumns);
    setSort(snap.sort);
  }, [locale]);

  return (
    <EventsTableWithFilter
      tableRows={tableRows}
      emptyMessage={emptyMessage}
      columns={columns}
      initialFilterColumns={initialFilterColumns}
      initialSearch={initialSearch}
      basePath={basePath}
      currentQueryParams={currentQueryParams}
      currentPage={currentPage}
      totalPages={totalPages}
      limit={limit}
      defaultLimit={defaultLimit}
      sort={sort}
      maxGoToPage={maxGoToPage}
      filterableColumnIds={filterableColumnIds}
      sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
      sortPrefsListKey="events"
      tableListStateCookieName={TABLE_LIST_STATE_COOKIE_NAME}
      onListMetadataChange={onListMetadataChange}
      trailingToolbar={
        <EventsSortSelect
          sort={sort}
          label={sortTimelineLabel}
          sortOptionLabels={sortOptionLabels}
          onListMetadataChange={onListMetadataChange}
        />
      }
    />
  );
}
