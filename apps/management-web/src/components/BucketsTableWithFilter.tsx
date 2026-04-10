'use client';

import type { TableFilterBarColumn } from '@metaboost/ui';

import { managementWebBuckets } from '@metaboost/helpers-requests';
import { ResourceTableWithFilter, type FilterableTableRow } from '@metaboost/ui';

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
}: BucketsTableWithFilterProps) {
  return (
    <ResourceTableWithFilter
      tableRows={tableRows}
      emptyMessage={emptyMessage}
      columns={columns}
      initialFilterColumns={initialFilterColumns}
      initialSearch={initialSearch}
      basePath={basePath}
      currentQueryParams={currentQueryParams}
      filterableColumnIds={filterableColumnIds}
      sortPrefsCookieName={sortPrefsCookieName}
      sortPrefsListKey={sortPrefsListKey}
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
