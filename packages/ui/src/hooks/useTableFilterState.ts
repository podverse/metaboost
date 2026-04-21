'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SEARCH_DEBOUNCE_MS } from '@metaboost/helpers';

import { mergeTableListStateInCookie } from '../components/table/tableListStateCookie';

export type UseTableFilterStateOptions = {
  initialSearch: string;
  initialFilterColumns: string[];
  allColumnIds: string[];
  basePath: string;
  currentQueryParams: Record<string, string>;
  /** When search changes, these params are also set (e.g. { page: '1' } to reset pagination). */
  searchSyncParams?: Record<string, string>;
  /** When set with listKey, search/filter updates persist to this cookie (no URL query push). */
  tableListStateCookieName?: string;
  /** List key shared with sort prefs / table list state cookie. */
  tableListStateListKey?: string;
  /**
   * When cookie mode is on: called immediately after the cookie merge. Pass the same callback
   * as `useCookieModeListRefresh(...).afterCookieListMutation` (strip params + overlay + client
   * list refetch). When omitted, falls back to `router.refresh()`.
   */
  afterCookieListMutation?: () => Promise<void>;
};

export function useTableFilterState({
  initialSearch,
  initialFilterColumns,
  allColumnIds,
  basePath,
  currentQueryParams,
  searchSyncParams,
  tableListStateCookieName,
  tableListStateListKey,
  afterCookieListMutation,
}: UseTableFilterStateOptions) {
  const router = useRouter();
  const [filter, setFilter] = useState(initialSearch);
  const lastInitialSearchRef = useRef(initialSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(() =>
    initialFilterColumns.length > 0 ? initialFilterColumns : allColumnIds
  );

  const cookieRefreshMode =
    tableListStateCookieName !== undefined &&
    tableListStateCookieName.trim() !== '' &&
    tableListStateListKey !== undefined &&
    tableListStateListKey.trim() !== '';

  useEffect(() => {
    if (initialSearch !== lastInitialSearchRef.current) {
      lastInitialSearchRef.current = initialSearch;
      setFilter(initialSearch);
    }
  }, [initialSearch]);

  const queryParamsKey = JSON.stringify(currentQueryParams);
  useEffect(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    if (filter === initialSearch) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      if (cookieRefreshMode) {
        mergeTableListStateInCookie(tableListStateCookieName, tableListStateListKey, {
          search: filter.trim(),
          page: 1,
        });
        void (afterCookieListMutation !== undefined
          ? afterCookieListMutation()
          : Promise.resolve(router.refresh()));
        return;
      }
      const params = new URLSearchParams(currentQueryParams);
      if (filter.trim() !== '') {
        params.set('search', filter.trim());
      } else {
        params.delete('search');
      }
      if (searchSyncParams !== undefined) {
        for (const [k, v] of Object.entries(searchSyncParams)) {
          params.set(k, v);
        }
      }
      const query = params.toString();
      router.push(query !== '' ? `${basePath}?${query}` : basePath);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [
    filter,
    initialSearch,
    basePath,
    queryParamsKey,
    router,
    currentQueryParams,
    searchSyncParams,
    cookieRefreshMode,
    tableListStateCookieName,
    tableListStateListKey,
    afterCookieListMutation,
  ]);

  const handleFilterColumnsChange = useCallback(
    (ids: string[]) => {
      setSelectedColumnIds(ids);
      if (cookieRefreshMode) {
        mergeTableListStateInCookie(tableListStateCookieName, tableListStateListKey, {
          filterColumns: ids.join(','),
          page: 1,
        });
        void (afterCookieListMutation !== undefined
          ? afterCookieListMutation()
          : Promise.resolve(router.refresh()));
        return;
      }
      const params = new URLSearchParams(currentQueryParams);
      params.set('filterColumns', ids.join(','));
      router.push(`${basePath}?${params.toString()}`);
    },
    [
      basePath,
      currentQueryParams,
      router,
      cookieRefreshMode,
      tableListStateCookieName,
      tableListStateListKey,
      afterCookieListMutation,
    ]
  );

  return { filter, setFilter, selectedColumnIds, handleFilterColumnsChange };
}
