'use client';

import type { ReactNode } from 'react';

import { useCallback } from 'react';

import { setSortPrefInCookie } from '../sortPrefsCookie';
import { Table } from '../Table/Table';

export type TableWithSortColumn = {
  id: string;
  label: ReactNode;
  sortable?: boolean;
  sortKey?: string;
  defaultSortOrder?: 'asc' | 'desc';
  /** String label for the sortable header (aria and button). When sortable, used for Table.SortableHeaderCell; omit to use label when it is a string. */
  sortLabel?: string;
};

export type TableWithSortProps = {
  columns: TableWithSortColumn[];
  sortBy: string | undefined;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortKey: string, nextOrder: 'asc' | 'desc') => void;
  children: ReactNode;
  className?: string;
  /** When set with sortPrefsListKey, save sort to cookie on header click (server reads cookie when URL has no sort). */
  sortPrefsCookieName?: string;
  /** Path-based list key (e.g. bucket-detail-buckets). Used with sortPrefsCookieName. */
  sortPrefsListKey?: string;
};

/**
 * Table with a configurable header row: sortable columns use Table.SortableHeaderCell,
 * others use Table.HeaderCell. Parent provides sortBy, sortOrder and onSortChange(sortKey, nextOrder).
 * Optional cookie props persist sort on header click; list sort is resolved on the server from cookies when the URL has no sort params.
 */
export function TableWithSort({
  columns,
  sortBy,
  sortOrder,
  onSortChange,
  children,
  className = '',
  sortPrefsCookieName,
  sortPrefsListKey,
}: TableWithSortProps) {
  const hasCookiePrefs =
    sortPrefsCookieName !== undefined &&
    sortPrefsCookieName.trim() !== '' &&
    sortPrefsListKey !== undefined &&
    sortPrefsListKey.trim() !== '';

  const handleSort = useCallback(
    (sortKey: string) => {
      const column = columns.find((c) => (c.sortKey ?? c.id) === sortKey);
      const defaultOrder = column?.defaultSortOrder ?? 'asc';
      const nextOrder = sortBy === sortKey ? (sortOrder === 'asc' ? 'desc' : 'asc') : defaultOrder;
      if (hasCookiePrefs && sortPrefsCookieName !== undefined && sortPrefsListKey !== undefined) {
        setSortPrefInCookie(sortPrefsCookieName, sortPrefsListKey, sortKey, nextOrder);
      }
      onSortChange(sortKey, nextOrder);
    },
    [
      columns,
      sortBy,
      sortOrder,
      onSortChange,
      hasCookiePrefs,
      sortPrefsCookieName,
      sortPrefsListKey,
    ]
  );

  return (
    <Table className={className}>
      <Table.Head>
        <Table.Row>
          {columns.map((col) => {
            const key = col.sortKey ?? col.id;
            if (col.sortable === true) {
              const label = col.sortLabel ?? (typeof col.label === 'string' ? col.label : 'Sort');
              return (
                <Table.SortableHeaderCell
                  key={col.id}
                  sortKey={key}
                  label={label}
                  activeSortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
              );
            }
            return <Table.HeaderCell key={col.id}>{col.label}</Table.HeaderCell>;
          })}
        </Table.Row>
      </Table.Head>
      {children}
    </Table>
  );
}
