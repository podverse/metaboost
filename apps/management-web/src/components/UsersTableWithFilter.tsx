'use client';

import type { TableFilterBarColumn } from '@boilerplate/ui';

import { managementWebUsers } from '@boilerplate/helpers-requests';
import { ResourceTableWithFilter, type FilterableTableRow } from '@boilerplate/ui';

import { userEditRoute, userViewRoute } from '../lib/routes';

export type { FilterableTableRow };

export type UsersTableWithFilterProps = {
  tableRows: FilterableTableRow[];
  emptyMessage?: string;
  columns: TableFilterBarColumn[];
  initialFilterColumns: string[];
  initialSearch: string;
  basePath: string;
  currentQueryParams: Record<string, string>;
  /** Column IDs that can be selected in the filter dropdown (default: all columns). */
  filterableColumnIds?: string[];
  canViewUser: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  userApiBaseUrl: string;
  addUserHref?: string;
  sortPrefsCookieName?: string;
  sortPrefsListKey?: string;
};

export function UsersTableWithFilter({
  tableRows,
  emptyMessage,
  columns,
  initialFilterColumns,
  initialSearch,
  basePath,
  currentQueryParams,
  filterableColumnIds,
  canViewUser,
  canUpdateUser,
  canDeleteUser,
  userApiBaseUrl,
  addUserHref,
  sortPrefsCookieName,
  sortPrefsListKey,
}: UsersTableWithFilterProps) {
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
      viewRoute={userViewRoute}
      viewLabelKey="usersTable.view"
      canView={canViewUser}
      editRoute={userEditRoute}
      onDelete={(baseUrl, id) => managementWebUsers.deleteUser(baseUrl, id)}
      addHref={addUserHref}
      addLabelKey="addUser"
      actionsLabelKey="usersTable.actions"
      editLabelKey="usersTable.edit"
      deleteLabelKey="usersTable.delete"
      canUpdate={canUpdateUser}
      canDelete={canDeleteUser}
      apiBaseUrl={userApiBaseUrl}
      confirmDeleteTranslationKeyPrefix="common.confirmDeleteUser"
      getDisplayName={(row) => row.cells['displayName'] ?? row.cells['email'] ?? ''}
    />
  );
}
