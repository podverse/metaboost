'use client';

import type { TableFilterBarColumn } from '@metaboost/ui';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { webBuckets } from '@metaboost/helpers-requests';
import { ResourceTableWithFilter, type FilterableTableRow } from '@metaboost/ui';

import { bucketTypeCellLabel } from '../lib/bucketTypeLabel';
import { fetchDashboardBucketsTableSnapshot } from '../lib/client/dashboardBucketsListClient';
import { bucketDetailRoute, bucketEditRoute } from '../lib/routes';

export type { FilterableTableRow };

export type BucketsTableWithFilterProps = {
  tableRows: FilterableTableRow[];
  emptyRowsMessage: string;
  columns: TableFilterBarColumn[];
  initialFilterColumns: string[];
  initialSearch: string;
  basePath: string;
  currentQueryParams: Record<string, string>;
  addBucketHref: string;
  /** Column IDs that can be selected in the filter dropdown (default: all columns). */
  filterableColumnIds?: string[];
  /** Cookie name for persisting sort preferences. When set with sortPrefsListKey, sort is restored. */
  sortPrefsCookieName?: string;
  /** List key for this table (e.g. buckets). Used with sortPrefsCookieName. */
  sortPrefsListKey?: string;
  /** When set with sortPrefsListKey, search/filter/sort use cookies + client list refetch. */
  tableListStateCookieName?: string;
  /** Optional set of sortable columns. Omit to make all columns sortable. */
  sortableColumnIds?: string[];
};

export function BucketsTableWithFilter({
  tableRows,
  emptyRowsMessage,
  columns,
  initialFilterColumns,
  initialSearch,
  basePath,
  currentQueryParams,
  addBucketHref,
  filterableColumnIds,
  sortPrefsCookieName,
  sortPrefsListKey,
  tableListStateCookieName,
  sortableColumnIds,
}: BucketsTableWithFilterProps) {
  const tBuckets = useTranslations('buckets');

  const [tableRowsState, setTableRowsState] = useState(tableRows);
  const [currentParamsState, setCurrentParamsState] = useState(currentQueryParams);
  const [initialSearchState, setInitialSearchState] = useState(initialSearch);

  useEffect(() => {
    setTableRowsState(tableRows);
    setCurrentParamsState(currentQueryParams);
    setInitialSearchState(initialSearch);
  }, [tableRows, currentQueryParams, initialSearch]);

  const cookieListMode =
    tableListStateCookieName !== undefined &&
    tableListStateCookieName.trim() !== '' &&
    sortPrefsCookieName !== undefined &&
    sortPrefsCookieName.trim() !== '' &&
    sortPrefsListKey !== undefined &&
    sortPrefsListKey.trim() !== '';

  const onListMetadataChange = useCallback(async () => {
    if (!cookieListMode) return;
    const snap = await fetchDashboardBucketsTableSnapshot({
      sortPrefsCookieName: sortPrefsCookieName ?? '',
      tableListStateCookieName: tableListStateCookieName ?? '',
      listKey: sortPrefsListKey ?? '',
      labelPublicYes: tBuckets('publicYes'),
      labelPublicNo: tBuckets('publicNo'),
      typeLabelFor: (type) => bucketTypeCellLabel(tBuckets, type),
    });
    if (snap === null) return;
    setTableRowsState(snap.tableRows);
    setCurrentParamsState(snap.currentQueryParams);
    setInitialSearchState(snap.initialSearch);
  }, [cookieListMode, sortPrefsCookieName, tableListStateCookieName, sortPrefsListKey, tBuckets]);

  return (
    <ResourceTableWithFilter
      tableRows={tableRowsState}
      emptyMessage={tableRowsState.length === 0 ? emptyRowsMessage : undefined}
      columns={columns}
      initialFilterColumns={initialFilterColumns}
      initialSearch={initialSearchState}
      basePath={basePath}
      currentQueryParams={currentParamsState}
      filterableColumnIds={filterableColumnIds}
      sortableColumnIds={sortableColumnIds}
      sortPrefsCookieName={sortPrefsCookieName}
      sortPrefsListKey={sortPrefsListKey}
      tableListStateCookieName={tableListStateCookieName}
      onListMetadataChange={cookieListMode ? onListMetadataChange : undefined}
      viewRoute={bucketDetailRoute}
      viewLabelKey="bucketsTable.view"
      viewLinkColumnId="name"
      canView={false}
      editRoute={bucketEditRoute}
      onDelete={async (baseUrl, id) => {
        const res = await webBuckets.reqDeleteBucket(baseUrl, id);
        return res.ok ? { ok: true } : { ok: false, error: { message: res.error?.message } };
      }}
      addHref={addBucketHref}
      addLabelKey="addBucket"
      actionsLabelKey="bucketsTable.actions"
      editLabelKey="bucketsTable.edit"
      deleteLabelKey="bucketsTable.delete"
      canUpdate={false}
      canDelete={false}
      apiBaseUrl=""
      confirmDeleteTranslationKeyPrefix="common.confirmDeleteBucket"
      getDisplayName={(row) => row.cells['name'] ?? ''}
    />
  );
}
