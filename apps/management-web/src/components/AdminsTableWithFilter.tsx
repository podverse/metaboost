'use client';

import type { TableFilterBarColumn } from '@metaboost/ui';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { managementWebAdmins } from '@metaboost/helpers-requests';
import {
  ResourceTableWithFilter,
  type FilterableTableRow,
  type ResourceTableWithFilterPagination,
} from '@metaboost/ui';

import { useAuth } from '../context/AuthContext';
import { fetchAdminsTableFromCookies } from '../lib/client/adminsListClient';
import { adminEditRoute, adminViewRoute, ROUTES } from '../lib/routes';

export type { FilterableTableRow };

export type AdminsTableWithFilterProps = {
  tableRows: FilterableTableRow[];
  emptyMessage?: string;
  columns: TableFilterBarColumn[];
  initialFilterColumns: string[];
  initialSearch: string;
  basePath: string;
  currentQueryParams: Record<string, string>;
  currentPage: number;
  totalPages: number;
  limit: number;
  defaultLimit: number;
  maxGoToPage?: number;
  canViewAdmin: boolean;
  canUpdateAdmin: boolean;
  canDeleteAdmin: boolean;
  adminApiBaseUrl: string;
  addAdminHref?: string;
  currentUserId?: string;
  sortPrefsCookieName?: string;
  sortPrefsListKey?: string;
  tableListStateCookieName?: string;
};

export function AdminsTableWithFilter({
  tableRows,
  emptyMessage,
  columns,
  initialFilterColumns,
  initialSearch,
  basePath,
  currentQueryParams,
  currentPage,
  totalPages,
  limit,
  defaultLimit,
  maxGoToPage,
  canViewAdmin,
  canUpdateAdmin,
  canDeleteAdmin,
  adminApiBaseUrl,
  addAdminHref,
  currentUserId,
  sortPrefsCookieName,
  sortPrefsListKey,
  tableListStateCookieName,
}: AdminsTableWithFilterProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const [tableRowsState, setTableRowsState] = useState(tableRows);
  const [currentParamsState, setCurrentParamsState] = useState(currentQueryParams);
  const [pageState, setPageState] = useState(currentPage);
  const [totalPagesState, setTotalPagesState] = useState(totalPages);
  const [initialSearchState, setInitialSearchState] = useState(initialSearch);
  const [initialFilterColsState, setInitialFilterColsState] = useState(initialFilterColumns);

  useEffect(() => {
    setTableRowsState(tableRows);
    setCurrentParamsState(currentQueryParams);
    setPageState(currentPage);
    setTotalPagesState(totalPages);
    setInitialSearchState(initialSearch);
    setInitialFilterColsState(initialFilterColumns);
  }, [tableRows, currentQueryParams, currentPage, totalPages, initialSearch, initialFilterColumns]);

  const cookieListMode =
    tableListStateCookieName !== undefined &&
    tableListStateCookieName.trim() !== '' &&
    sortPrefsCookieName !== undefined &&
    sortPrefsCookieName.trim() !== '' &&
    sortPrefsListKey !== undefined &&
    sortPrefsListKey.trim() !== '';

  const onListMetadataChange = useCallback(async () => {
    if (!cookieListMode) return;
    const snap = await fetchAdminsTableFromCookies({
      sortPrefsCookieName: sortPrefsCookieName ?? '',
      tableListStateCookieName: tableListStateCookieName ?? '',
    });
    if (snap === null) return;
    setTableRowsState(snap.tableRows);
    setCurrentParamsState(snap.currentQueryParams);
    setPageState(snap.currentPage);
    setTotalPagesState(snap.totalPages);
    setInitialSearchState(snap.initialSearch);
    setInitialFilterColsState(snap.initialFilterColumns);
  }, [cookieListMode, sortPrefsCookieName, tableListStateCookieName]);

  const pagination: ResourceTableWithFilterPagination = {
    currentPage: pageState,
    totalPages: totalPagesState,
    limit,
    defaultLimit,
    maxGoToPage,
  };

  const getRowActions = (
    row: FilterableTableRow
  ): { canView: boolean; canUpdate: boolean; canDelete: boolean } => {
    if (row.isSuperAdmin === true) {
      return {
        canView: canViewAdmin,
        canUpdate: currentUserId !== undefined && row.id === currentUserId,
        canDelete: false,
      };
    }
    return {
      canView: canViewAdmin,
      canUpdate: canUpdateAdmin,
      canDelete: canDeleteAdmin,
    };
  };

  return (
    <ResourceTableWithFilter
      tableRows={tableRowsState}
      emptyMessage={emptyMessage}
      columns={columns}
      initialFilterColumns={initialFilterColsState}
      initialSearch={initialSearchState}
      basePath={basePath}
      currentQueryParams={currentParamsState}
      sortPrefsCookieName={sortPrefsCookieName}
      sortPrefsListKey={sortPrefsListKey}
      tableListStateCookieName={tableListStateCookieName}
      onListMetadataChange={cookieListMode ? onListMetadataChange : undefined}
      viewRoute={adminViewRoute}
      viewLabelKey="adminsTable.view"
      canView={canViewAdmin}
      editRoute={adminEditRoute}
      onDelete={(baseUrl, id) => managementWebAdmins.deleteAdmin(baseUrl, id)}
      addHref={addAdminHref}
      addLabelKey="addAdmin"
      actionsLabelKey="adminsTable.actions"
      editLabelKey="adminsTable.edit"
      deleteLabelKey="adminsTable.delete"
      canUpdate={canUpdateAdmin}
      canDelete={canDeleteAdmin}
      getRowActions={getRowActions}
      apiBaseUrl={adminApiBaseUrl}
      confirmDeleteTranslationKeyPrefix="common.confirmDeleteAdmin"
      getDisplayName={(row) => row.cells['displayName'] ?? ''}
      pagination={pagination}
      currentUserId={currentUserId}
      onSelfDelete={async () => {
        logout();
        router.push(ROUTES.LOGIN);
      }}
      searchSyncParams={{ page: '1' }}
    />
  );
}
