'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import { useDeleteModal } from '../../../hooks/useDeleteModal';
import { useTableFilterState } from '../../../hooks/useTableFilterState';
import { ButtonLink } from '../../form/ButtonLink';
import { CrudButtons } from '../../form/CrudButtons';
import { Text } from '../../layout/Text';
import { ConfirmDeleteModal } from '../../modal/ConfirmDeleteModal/ConfirmDeleteModal';
import { Link } from '../../navigation/Link';
import { Pagination } from '../../navigation/Pagination';
import { getSortPrefsFromCookie, setSortPrefInCookie } from '../sortPrefsCookie';
import { Table } from '../Table';
import { TableFilterBar, type TableFilterBarColumn } from '../TableFilterBar';

import styles from './ResourceTableWithFilter.module.scss';

export type FilterableTableRow = {
  id: string;
  cells: Record<string, string>;
  isSuperAdmin?: boolean;
};

export type ResourceTableWithFilterPagination = {
  currentPage: number;
  totalPages: number;
  limit: number;
  defaultLimit: number;
  maxGoToPage?: number;
};

export type ResourceTableWithFilterProps = {
  tableRows: FilterableTableRow[];
  emptyMessage?: string;
  columns: TableFilterBarColumn[];
  initialFilterColumns: string[];
  initialSearch: string;
  basePath: string;
  currentQueryParams: Record<string, string>;
  viewRoute?: (id: string) => string;
  viewLabelKey?: string;
  /** When set, only this column's cell is a link to the view route; other columns render plain. When undefined, every column cell is a link (backward compatible). */
  viewLinkColumnId?: string;
  canView?: boolean;
  editRoute: (id: string) => string;
  onDelete: (
    baseUrl: string,
    id: string
  ) => Promise<{
    ok: boolean;
    error?: { message?: string };
  }>;
  addHref?: string;
  addLabelKey: string;
  actionsLabelKey: string;
  editLabelKey: string;
  deleteLabelKey: string;
  canUpdate: boolean;
  canDelete: boolean;
  getRowActions?: (row: FilterableTableRow) => {
    canView?: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
  apiBaseUrl: string;
  confirmDeleteTranslationKeyPrefix: string;
  getDisplayName: (row: FilterableTableRow) => string;
  pagination?: ResourceTableWithFilterPagination;
  currentUserId?: string;
  onSelfDelete?: () => Promise<void>;
  searchSyncParams?: Record<string, string>;
  /** When set, only these column IDs appear in the filter dropdown and are used for search. Omit to allow all columns. */
  filterableColumnIds?: string[];
  /** When set, only these column IDs have sortable headers. Omit to make all data columns sortable. */
  sortableColumnIds?: string[];
  /** Cookie name for persisting sort preferences (e.g. table_sort_prefs). When set with sortPrefsListKey, sort is saved on change and restored when URL has no sort. */
  sortPrefsCookieName?: string;
  /** List key for this table (e.g. buckets, admins). Used with sortPrefsCookieName to scope preferences. */
  sortPrefsListKey?: string;
};

export function ResourceTableWithFilter({
  tableRows,
  emptyMessage,
  columns,
  initialFilterColumns,
  filterableColumnIds,
  initialSearch,
  basePath,
  currentQueryParams,
  viewRoute,
  viewLabelKey,
  viewLinkColumnId,
  canView = false,
  editRoute,
  onDelete,
  addHref,
  addLabelKey,
  actionsLabelKey,
  editLabelKey,
  deleteLabelKey,
  canUpdate,
  canDelete,
  getRowActions,
  apiBaseUrl,
  confirmDeleteTranslationKeyPrefix,
  getDisplayName,
  pagination,
  currentUserId,
  onSelfDelete,
  searchSyncParams,
  sortableColumnIds,
  sortPrefsCookieName,
  sortPrefsListKey,
}: ResourceTableWithFilterProps) {
  const router = useRouter();
  const tFilterBar = useTranslations('ui.tableFilterBar');
  const tPagination = useTranslations('ui.pagination');
  const tGoToModal = useTranslations('ui.pagination.goToPageModal');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  const filterPlaceholder = tFilterBar('placeholder');
  const filterColumnsLabel = tFilterBar('filterColumnsLabel');
  const funnelButtonLabel = tFilterBar('funnelButtonLabel');

  const paginationLabels = useMemo(
    () =>
      pagination !== undefined
        ? {
            previous: tPagination('previous'),
            next: tPagination('next'),
            goToPage: tPagination('goToPage'),
            goToPageModal: {
              title: tGoToModal('title'),
              pageLabel: tGoToModal('pageLabel'),
              submitLabel: tGoToModal('submitLabel'),
              closeLabel: tGoToModal('closeLabel'),
            },
          }
        : undefined,
    [pagination, tPagination, tGoToModal]
  );

  const filterColumns = useMemo(
    () =>
      filterableColumnIds !== undefined && filterableColumnIds.length > 0
        ? columns.filter((c) => filterableColumnIds.includes(c.id))
        : columns,
    [columns, filterableColumnIds]
  );
  const allColumnIds = useMemo(() => filterColumns.map((c) => c.id), [filterColumns]);
  const { filter, setFilter, selectedColumnIds, handleFilterColumnsChange } = useTableFilterState({
    initialSearch,
    initialFilterColumns,
    allColumnIds,
    basePath,
    currentQueryParams,
    searchSyncParams,
  });

  const {
    deleteTarget,
    setDeleteTarget,
    deleteLoading,
    deleteError,
    handleConfirm: handleDeleteConfirm,
    handleCancel: handleDeleteCancel,
  } = useDeleteModal({
    onDelete,
    apiBaseUrl,
    deleteFailedMessage: tErrors('deleteFailed'),
    currentUserId,
    onSelfDelete,
  });

  const rowsToShow = tableRows;

  const getActions = (
    row: FilterableTableRow
  ): { canView: boolean; canUpdate: boolean; canDelete: boolean } => {
    if (getRowActions !== undefined) {
      const a = getRowActions(row);
      return {
        canView: a.canView ?? canView,
        canUpdate: a.canUpdate,
        canDelete: a.canDelete,
      };
    }
    return { canView, canUpdate, canDelete };
  };

  const showActions =
    getRowActions !== undefined
      ? rowsToShow.some((row) => {
          const a = getActions(row);
          return a.canView || a.canUpdate || a.canDelete;
        })
      : canView || canUpdate || canDelete;

  const emptyColSpan = columns.length + (showActions ? 1 : 0);

  const isColumnSortable = useCallback(
    (colId: string) => sortableColumnIds === undefined || sortableColumnIds.includes(colId),
    [sortableColumnIds]
  );

  const firstSortableColumn = useMemo(
    () => columns.find((c) => isColumnSortable(c.id)),
    [columns, isColumnSortable]
  );
  const firstSortableColumnKey = useMemo(
    () =>
      firstSortableColumn !== undefined
        ? (firstSortableColumn.sortKey ?? firstSortableColumn.id)
        : undefined,
    [firstSortableColumn]
  );

  useEffect(() => {
    if (firstSortableColumnKey === undefined) return;
    const hasSortBy =
      currentQueryParams.sortBy !== undefined && currentQueryParams.sortBy.trim() !== '';
    if (hasSortBy) return;
    const params = new URLSearchParams(currentQueryParams);
    if (
      sortPrefsCookieName !== undefined &&
      sortPrefsListKey !== undefined &&
      sortPrefsCookieName.trim() !== '' &&
      sortPrefsListKey.trim() !== ''
    ) {
      const pref = getSortPrefsFromCookie(sortPrefsCookieName, sortPrefsListKey);
      if (pref !== null) {
        params.set('sortBy', pref.sortBy);
        params.set('sortOrder', pref.sortOrder);
        router.replace(`${basePath}?${params.toString()}`);
        return;
      }
    }
    params.set('sortBy', firstSortableColumnKey);
    params.set('sortOrder', firstSortableColumn?.defaultSortOrder ?? 'desc');
    router.replace(`${basePath}?${params.toString()}`);
  }, [
    basePath,
    currentQueryParams,
    firstSortableColumn,
    firstSortableColumnKey,
    router,
    sortPrefsCookieName,
    sortPrefsListKey,
  ]);

  const effectiveSortBy = currentQueryParams.sortBy?.trim() ?? firstSortableColumnKey;
  const effectiveSortOrder: 'asc' | 'desc' =
    currentQueryParams.sortOrder === 'asc' || currentQueryParams.sortOrder === 'desc'
      ? currentQueryParams.sortOrder
      : (columns.find((c) => (c.sortKey ?? c.id) === effectiveSortBy)?.defaultSortOrder ?? 'desc');

  const handleSortHeaderClick = useCallback(
    (sortKey: string) => {
      const nextOrder =
        effectiveSortBy === sortKey && effectiveSortOrder === 'asc' ? 'desc' : 'asc';
      const params = new URLSearchParams(currentQueryParams);
      params.set('sortBy', sortKey);
      params.set('sortOrder', nextOrder);
      params.set('page', '1');
      router.push(`${basePath}?${params.toString()}`);
      if (
        sortPrefsCookieName !== undefined &&
        sortPrefsListKey !== undefined &&
        sortPrefsCookieName.trim() !== '' &&
        sortPrefsListKey.trim() !== ''
      ) {
        setSortPrefInCookie(sortPrefsCookieName, sortPrefsListKey, sortKey, nextOrder);
      }
    },
    [
      basePath,
      currentQueryParams,
      router,
      effectiveSortBy,
      effectiveSortOrder,
      sortPrefsCookieName,
      sortPrefsListKey,
    ]
  );

  return (
    <>
      <div className={styles.filterAddRow}>
        <div className={styles.filterRow}>
          <TableFilterBar
            searchValue={filter}
            onSearchChange={setFilter}
            columns={filterColumns}
            selectedColumnIds={selectedColumnIds}
            onSelectedColumnIdsChange={handleFilterColumnsChange}
            placeholder={filterPlaceholder}
            filterColumnsLabel={filterColumnsLabel}
            funnelButtonLabel={funnelButtonLabel}
          />
        </div>
        {addHref !== undefined && (
          <ButtonLink href={addHref} variant="primary" className={styles.addButton}>
            {tCommon(addLabelKey)}
          </ButtonLink>
        )}
      </div>
      {deleteError !== null && (
        <Text variant="error" role="alert" className={styles.deleteError}>
          {deleteError}
        </Text>
      )}
      <Table.ScrollContainer>
        <Table>
          <Table.Head>
            <Table.Row>
              {columns.map((col) => {
                const sortKey = col.sortKey ?? col.id;
                const sortable = isColumnSortable(col.id);
                return sortable ? (
                  <Table.SortableHeaderCell
                    key={col.id}
                    sortKey={sortKey}
                    label={col.label}
                    activeSortBy={effectiveSortBy}
                    sortOrder={effectiveSortOrder}
                    onSort={handleSortHeaderClick}
                  />
                ) : (
                  <Table.HeaderCell key={col.id}>{col.label}</Table.HeaderCell>
                );
              })}
              {showActions && <Table.HeaderCell>{tCommon(actionsLabelKey)}</Table.HeaderCell>}
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {rowsToShow.length === 0 && emptyMessage !== undefined && emptyMessage !== '' ? (
              <Table.Row>
                <Table.Cell colSpan={emptyColSpan} className={styles.emptyCell}>
                  {emptyMessage}
                </Table.Cell>
              </Table.Row>
            ) : null}
            {rowsToShow.map((row) => {
              const rowActions = getActions(row);
              const rowHref =
                viewRoute !== undefined && viewLabelKey !== undefined
                  ? viewRoute(row.id)
                  : undefined;
              const cellIsViewLink = (colId: string) =>
                rowHref !== undefined &&
                (viewLinkColumnId === undefined || viewLinkColumnId === colId);
              return (
                <Table.Row key={row.id}>
                  {columns.map((col) => {
                    const cellContent = row.cells[col.id] ?? '—';
                    const columnHref = col.getHref?.(row);
                    const href = columnHref ?? (cellIsViewLink(col.id) ? rowHref : undefined);
                    return (
                      <Table.Cell key={col.id}>
                        <span className={styles.cellContent}>
                          {href !== undefined ? (
                            <Link href={href} className={styles.cellLink} tabIndex={0}>
                              {cellContent}
                            </Link>
                          ) : (
                            cellContent
                          )}
                        </span>
                      </Table.Cell>
                    );
                  })}
                  {showActions && (
                    <Table.Cell>
                      <div className={styles.actionsCell}>
                        <CrudButtons
                          viewHref={
                            rowActions.canView &&
                            viewRoute !== undefined &&
                            viewLabelKey !== undefined
                              ? viewRoute(row.id)
                              : undefined
                          }
                          viewLabel={viewLabelKey !== undefined ? tCommon(viewLabelKey) : undefined}
                          editHref={rowActions.canUpdate ? editRoute(row.id) : undefined}
                          editLabel={tCommon(editLabelKey)}
                          onDelete={
                            rowActions.canDelete
                              ? () =>
                                  setDeleteTarget({
                                    id: row.id,
                                    displayName: getDisplayName(row),
                                  })
                              : undefined
                          }
                          deleteLabel={tCommon(deleteLabelKey)}
                        />
                      </div>
                    </Table.Cell>
                  )}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </Table.ScrollContainer>
      {pagination !== undefined && paginationLabels !== undefined && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          basePath={basePath}
          limit={pagination.limit}
          defaultLimit={pagination.defaultLimit}
          queryParams={Object.keys(currentQueryParams).length > 0 ? currentQueryParams : undefined}
          maxGoToPage={pagination.maxGoToPage}
          labels={paginationLabels}
        />
      )}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        displayName={deleteTarget?.displayName ?? ''}
        translationKeyPrefix={confirmDeleteTranslationKeyPrefix}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
        onCancel={handleDeleteCancel}
        confirmLoading={deleteLoading}
      />
    </>
  );
}
