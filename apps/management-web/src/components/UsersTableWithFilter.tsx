'use client';

import type { TableFilterBarColumn } from '@metaboost/ui';

import { useCallback, useEffect, useState } from 'react';

import { managementWebUsers } from '@metaboost/helpers-requests';
import { ResourceTableWithFilter, type FilterableTableRow } from '@metaboost/ui';

import { fetchUsersTableFromCookies } from '../lib/client/usersListClient';
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
  tableListStateCookieName?: string;
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
  tableListStateCookieName,
}: UsersTableWithFilterProps) {
  const [tableRowsState, setTableRowsState] = useState(tableRows);
  const [currentParamsState, setCurrentParamsState] = useState(currentQueryParams);
  const [initialSearchState, setInitialSearchState] = useState(initialSearch);
  const [initialFilterColsState, setInitialFilterColsState] = useState(initialFilterColumns);

  useEffect(() => {
    setTableRowsState(tableRows);
    setCurrentParamsState(currentQueryParams);
    setInitialSearchState(initialSearch);
    setInitialFilterColsState(initialFilterColumns);
  }, [tableRows, currentQueryParams, initialSearch, initialFilterColumns]);

  const cookieListMode =
    tableListStateCookieName !== undefined &&
    tableListStateCookieName.trim() !== '' &&
    sortPrefsCookieName !== undefined &&
    sortPrefsCookieName.trim() !== '' &&
    sortPrefsListKey !== undefined &&
    sortPrefsListKey.trim() !== '';

  const onListMetadataChange = useCallback(async () => {
    if (!cookieListMode) return;
    const snap = await fetchUsersTableFromCookies({
      sortPrefsCookieName: sortPrefsCookieName ?? '',
      tableListStateCookieName: tableListStateCookieName ?? '',
    });
    if (snap === null) return;
    setTableRowsState(snap.tableRows);
    setCurrentParamsState(snap.currentQueryParams);
    setInitialSearchState(snap.initialSearch);
    setInitialFilterColsState(snap.initialFilterColumns);
  }, [cookieListMode, sortPrefsCookieName, tableListStateCookieName]);

  return (
    <ResourceTableWithFilter
      tableRows={tableRowsState}
      emptyMessage={emptyMessage}
      columns={columns}
      initialFilterColumns={initialFilterColsState}
      initialSearch={initialSearchState}
      basePath={basePath}
      currentQueryParams={currentParamsState}
      filterableColumnIds={filterableColumnIds}
      sortPrefsCookieName={sortPrefsCookieName}
      sortPrefsListKey={sortPrefsListKey}
      tableListStateCookieName={tableListStateCookieName}
      onListMetadataChange={cookieListMode ? onListMetadataChange : undefined}
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
