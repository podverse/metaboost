'use client';

import type { TableFilterBarColumn } from '@boilerplate/ui';

import { webBuckets } from '@boilerplate/helpers-requests';
import { ResourceTableWithFilter, type FilterableTableRow } from '@boilerplate/ui';

import { bucketDetailRoute, bucketEditRoute } from '../lib/routes';

export type { FilterableTableRow };

export type BucketsTableWithFilterProps = {
  tableRows: FilterableTableRow[];
  emptyMessage?: string;
  columns: TableFilterBarColumn[];
  initialFilterColumns: string[];
  initialSearch: string;
  basePath: string;
  currentQueryParams: Record<string, string>;
  addBucketHref: string;
  /** Column IDs that can be selected in the filter dropdown (default: all columns). */
  filterableColumnIds?: string[];
  /** Cookie name for persisting sort preferences. When set with sortPrefsListKey, sort is saved and restored. */
  sortPrefsCookieName?: string;
  /** List key for this table (e.g. buckets). Used with sortPrefsCookieName. */
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
  addBucketHref,
  filterableColumnIds,
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
