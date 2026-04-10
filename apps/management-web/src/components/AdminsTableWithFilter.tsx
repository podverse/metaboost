'use client';

import type { TableFilterBarColumn } from '@metaboost/ui';

import { useRouter } from 'next/navigation';

import { managementWebAdmins } from '@metaboost/helpers-requests';
import {
  ResourceTableWithFilter,
  type FilterableTableRow,
  type ResourceTableWithFilterPagination,
} from '@metaboost/ui';

import { useAuth } from '../context/AuthContext';
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
}: AdminsTableWithFilterProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const pagination: ResourceTableWithFilterPagination = {
    currentPage,
    totalPages,
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
      tableRows={tableRows}
      emptyMessage={emptyMessage}
      columns={columns}
      initialFilterColumns={initialFilterColumns}
      initialSearch={initialSearch}
      basePath={basePath}
      currentQueryParams={currentQueryParams}
      sortPrefsCookieName={sortPrefsCookieName}
      sortPrefsListKey={sortPrefsListKey}
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
