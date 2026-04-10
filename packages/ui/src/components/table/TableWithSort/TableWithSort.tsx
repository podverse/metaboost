'use client';

import type { ReactNode } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import { getSortPrefsFromCookie, setSortPrefInCookie } from '../sortPrefsCookie';
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
  /** When set with sortPrefsListKey and getSortUrl, restore sort from cookie when URL has no sortBy/sortOrder and save on header click. */
  sortPrefsCookieName?: string;
  /** Path-based list key (e.g. bucket-detail-buckets). Used with sortPrefsCookieName. */
  sortPrefsListKey?: string;
  /** Build URL for a given sort; used by restore effect. When sortPrefsCookieName and sortPrefsListKey are set, required for restore. */
  getSortUrl?: (sortBy: string, sortOrder: 'asc' | 'desc') => string;
  /** When both set, restore effect skips router.replace when cookie pref matches these (avoids infinite loop when default sort is saved). */
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
};

/**
 * Table with a configurable header row: sortable columns use Table.SortableHeaderCell,
 * others use Table.HeaderCell. Parent provides sortBy, sortOrder and onSortChange(sortKey, nextOrder).
 * Optional cookie props enable restore when URL has no sort and save on header click.
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
  getSortUrl,
  defaultSortBy,
  defaultSortOrder,
}: TableWithSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasCookiePrefs =
    sortPrefsCookieName !== undefined &&
    sortPrefsCookieName.trim() !== '' &&
    sortPrefsListKey !== undefined &&
    sortPrefsListKey.trim() !== '' &&
    getSortUrl !== undefined;

  useEffect(() => {
    if (!hasCookiePrefs) return;
    const hasSortBy = searchParams.get('sortBy') !== null;
    const hasSortOrder = searchParams.get('sortOrder') !== null;
    if (hasSortBy || hasSortOrder) return;
    const pref = getSortPrefsFromCookie(sortPrefsCookieName, sortPrefsListKey);
    if (pref === null) return;
    if (
      defaultSortBy !== undefined &&
      defaultSortOrder !== undefined &&
      pref.sortBy === defaultSortBy &&
      pref.sortOrder === defaultSortOrder
    ) {
      return;
    }
    const url = getSortUrl(pref.sortBy, pref.sortOrder);
    const currentUrl =
      pathname + (searchParams.toString() !== '' ? `?${searchParams.toString()}` : '');
    if (url === currentUrl) return;
    router.replace(url);
  }, [
    hasCookiePrefs,
    sortPrefsCookieName,
    sortPrefsListKey,
    getSortUrl,
    defaultSortBy,
    defaultSortOrder,
    pathname,
    searchParams,
    router,
  ]);

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
