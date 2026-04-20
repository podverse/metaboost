'use client';

import type { TableFilterBarColumn } from '@metaboost/ui';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { managementWebBuckets } from '@metaboost/helpers-requests';
import { ResourceTableWithFilter, type FilterableTableRow } from '@metaboost/ui';

import { fetchBucketsTableFromCookies } from '../lib/client/bucketsListClient';
import { bucketEditRoute, bucketViewRoute } from '../lib/routes';

export type { FilterableTableRow };

export type BucketsTableWithFilterProps = {
  tableRows: FilterableTableRow[];
  emptyMessage?: string;
  columns: TableFilterBarColumn[];
  initialFilterColumns: string[];
  initialSearch: string;
  basePath: string;
  currentQueryParams: Record<string, string>;
  filterableColumnIds?: string[];
  canViewBucket: boolean;
  canUpdateBucket: boolean;
  canDeleteBucket: boolean;
  apiBaseUrl: string;
  addBucketHref?: string;
  sortPrefsCookieName?: string;
  sortPrefsListKey?: string;
  tableListStateCookieName?: string;
};

export function BucketsTableWithFilter({
  tableRows,
  emptyMessage,
  columns,
  initialFilterColumns,
  initialSearch,
  basePath,
  currentQueryParams,
  filterableColumnIds,
  canViewBucket,
  canUpdateBucket,
  canDeleteBucket,
  apiBaseUrl,
  addBucketHref,
  sortPrefsCookieName,
  sortPrefsListKey,
  tableListStateCookieName,
}: BucketsTableWithFilterProps) {
  const tCommon = useTranslations('common');

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
    const snap = await fetchBucketsTableFromCookies({
      sortPrefsCookieName: sortPrefsCookieName ?? '',
      tableListStateCookieName: tableListStateCookieName ?? '',
      visibilityYesLabel: tCommon('usersTable.visibilityYes'),
      visibilityNoLabel: tCommon('usersTable.visibilityNo'),
    });
    if (snap === null) return;
    setTableRowsState(snap.tableRows);
    setCurrentParamsState(snap.currentQueryParams);
    setInitialSearchState(snap.initialSearch);
  }, [cookieListMode, sortPrefsCookieName, tableListStateCookieName, tCommon]);

  return (
    <ResourceTableWithFilter
      tableRows={tableRowsState}
      emptyMessage={emptyMessage}
      columns={columns}
      initialFilterColumns={initialFilterColumns}
      initialSearch={initialSearchState}
      basePath={basePath}
      currentQueryParams={currentParamsState}
      filterableColumnIds={filterableColumnIds}
      sortPrefsCookieName={sortPrefsCookieName}
      sortPrefsListKey={sortPrefsListKey}
      tableListStateCookieName={tableListStateCookieName}
      onListMetadataChange={cookieListMode ? onListMetadataChange : undefined}
      viewRoute={bucketViewRoute}
      viewLabelKey="bucketsTable.view"
      canView={canViewBucket}
      editRoute={bucketEditRoute}
      onDelete={(baseUrl, id) => managementWebBuckets.deleteBucket(baseUrl, id)}
      addHref={addBucketHref}
      addLabelKey="addBucket"
      actionsLabelKey="bucketsTable.actions"
      editLabelKey="bucketsTable.edit"
      deleteLabelKey="bucketsTable.delete"
      canUpdate={canUpdateBucket}
      canDelete={canDeleteBucket}
      apiBaseUrl={apiBaseUrl}
      confirmDeleteTranslationKeyPrefix="common.confirmDeleteBucket"
      getDisplayName={(row) => (row.cells['name'] as string) ?? ''}
    />
  );
}
