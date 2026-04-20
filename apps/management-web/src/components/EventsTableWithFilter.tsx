'use client';

import { TableWithFilter, type FilterableTableRow, type TableFilterBarColumn } from '@metaboost/ui';

export type { FilterableTableRow };

export type EventsTableWithFilterProps = {
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
  /** Column IDs that can be selected in the filter dropdown (default: all columns). */
  filterableColumnIds?: string[];
  /** Rendered on the same row as the filter (e.g. sort select). */
  trailingToolbar?: React.ReactNode;
  sortPrefsCookieName?: string;
  sortPrefsListKey?: string;
  tableListStateCookieName?: string;
  /** When cookie list mode: client refetch instead of router.refresh(). */
  onListMetadataChange?: () => Promise<void>;
};

export function EventsTableWithFilter(props: EventsTableWithFilterProps) {
  const {
    sort,
    trailingToolbar,
    sortPrefsCookieName,
    sortPrefsListKey,
    tableListStateCookieName,
    onListMetadataChange,
    ...rest
  } = props;
  const extraPaginationParams =
    tableListStateCookieName === undefined && sort === 'oldest' ? { sort: 'oldest' } : undefined;
  return (
    <TableWithFilter
      {...rest}
      extraPaginationParams={extraPaginationParams}
      trailingToolbar={trailingToolbar}
      sortPrefsCookieName={sortPrefsCookieName}
      sortPrefsListKey={sortPrefsListKey}
      tableListStateCookieName={tableListStateCookieName}
      onListMetadataChange={onListMetadataChange}
    />
  );
}
