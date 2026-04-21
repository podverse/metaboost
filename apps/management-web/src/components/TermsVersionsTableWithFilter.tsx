'use client';

import type { TableFilterBarColumn } from '@metaboost/ui';

import { ResourceTableWithFilter, type FilterableTableRow } from '@metaboost/ui';

import { termsVersionEditRoute } from '../lib/routes';

export type { FilterableTableRow };

export type TermsVersionsTableWithFilterProps = {
  tableRows: FilterableTableRow[];
  emptyMessage?: string;
  columns: TableFilterBarColumn[];
  initialFilterColumns: string[];
  initialSearch: string;
  basePath: string;
  currentQueryParams: Record<string, string>;
  canUpdateTermsVersion: boolean;
  termsApiBaseUrl: string;
  addTermsVersionHref?: string;
};

const MUTABLE_STATUSES = new Set(['draft', 'upcoming']);

export function TermsVersionsTableWithFilter({
  tableRows,
  emptyMessage,
  columns,
  initialFilterColumns,
  initialSearch,
  basePath,
  currentQueryParams,
  canUpdateTermsVersion,
  termsApiBaseUrl,
  addTermsVersionHref,
}: TermsVersionsTableWithFilterProps) {
  return (
    <ResourceTableWithFilter
      tableRows={tableRows}
      emptyMessage={emptyMessage}
      columns={columns}
      initialFilterColumns={initialFilterColumns}
      initialSearch={initialSearch}
      basePath={basePath}
      currentQueryParams={currentQueryParams}
      filterableColumnIds={['versionKey', 'title', 'status', 'contentHash']}
      sortableColumnIds={[
        'versionKey',
        'title',
        'status',
        'enforcementStartsAt',
        'announcementStartsAt',
      ]}
      rowLinkRoute={termsVersionEditRoute}
      editRoute={termsVersionEditRoute}
      onDelete={async () => ({ ok: false, error: { message: 'Delete is not supported.' } })}
      addHref={addTermsVersionHref}
      addLabelKey="addTermsVersion"
      actionsLabelKey="termsVersionsTable.actions"
      editLabelKey="termsVersionsTable.edit"
      deleteLabelKey="termsVersionsTable.delete"
      canUpdate={canUpdateTermsVersion}
      canDelete={false}
      getRowActions={(row) => {
        const rawStatus = row.cells['statusRaw'] ?? '';
        return {
          canView: false,
          canUpdate: canUpdateTermsVersion && MUTABLE_STATUSES.has(rawStatus),
          canDelete: false,
        };
      }}
      apiBaseUrl={termsApiBaseUrl}
      confirmDeleteTranslationKeyPrefix="common.confirmDeleteTermsVersion"
      getDisplayName={(row) => row.cells['title'] ?? row.cells['versionKey'] ?? ''}
      searchSyncParams={{}}
    />
  );
}
