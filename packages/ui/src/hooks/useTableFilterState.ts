'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SEARCH_DEBOUNCE_MS } from '@metaboost/helpers';

export type UseTableFilterStateOptions = {
  initialSearch: string;
  initialFilterColumns: string[];
  allColumnIds: string[];
  basePath: string;
  currentQueryParams: Record<string, string>;
  /** When search changes, these params are also set (e.g. { page: '1' } to reset pagination). */
  searchSyncParams?: Record<string, string>;
};

export function useTableFilterState({
  initialSearch,
  initialFilterColumns,
  allColumnIds,
  basePath,
  currentQueryParams,
  searchSyncParams,
}: UseTableFilterStateOptions) {
  const router = useRouter();
  const [filter, setFilter] = useState(initialSearch);
  const lastInitialSearchRef = useRef(initialSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(() =>
    initialFilterColumns.length > 0 ? initialFilterColumns : allColumnIds
  );

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
  ]);

  const handleFilterColumnsChange = useCallback(
    (ids: string[]) => {
      setSelectedColumnIds(ids);
      const params = new URLSearchParams(currentQueryParams);
      params.set('filterColumns', ids.join(','));
      router.push(`${basePath}?${params.toString()}`);
    },
    [basePath, currentQueryParams, router]
  );

  return { filter, setFilter, selectedColumnIds, handleFilterColumnsChange };
}
