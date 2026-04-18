'use client';

import type { DataDetailItem } from '../../layout/DataDetail/DataDetail';
import type { TableWithSortColumn } from '../../table/TableWithSort';
import type { ReactNode } from 'react';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { ButtonLink } from '../../form/ButtonLink/ButtonLink';
import { CrudButtons } from '../../form/CrudButtons/CrudButtons';
import { Container } from '../../layout/Container/Container';
import { DataDetail } from '../../layout/DataDetail/DataDetail';
import { PageHeader } from '../../layout/PageHeader/PageHeader';
import { Row } from '../../layout/Row/Row';
import { SectionWithHeading } from '../../layout/SectionWithHeading/SectionWithHeading';
import { Stack } from '../../layout/Stack/Stack';
import { Link } from '../../navigation/Link/Link';
import { Table } from '../../table/Table/Table';
import { TableWithSort } from '../../table/TableWithSort';

import styles from './BucketDetailContent.module.scss';

const DEFAULT_BUCKETS_SORT_BY = 'name';
const DEFAULT_BUCKETS_SORT_ORDER = 'asc' as const;

export type BucketDetailBucket = {
  id: string;
  name: string;
  href: string;
  /** Optional edit URL for this bucket row. When set, edit button is shown (avoids passing a function from Server Components). */
  editHref?: string;
  /** Formatted date string for the Created column. */
  createdAtDisplay: string;
  /** Formatted date string for the Last Message column; when null/undefined show "—". */
  lastMessageAtDisplay?: string | null;
  /** Display value for the Public column (e.g. "Yes" / "No"). When undefined, show "—". */
  isPublicDisplay?: ReactNode;
};

export type BucketDetailContentProps = {
  bucketName: ReactNode;
  detailItems: DataDetailItem[];
  /** When true, show Messages button. When false, Messages tab/link is hidden (e.g. when admin has no bucket messages CRUD read). */
  showMessagesLink: boolean;
  messagesHref?: string;
  messagesLabel: ReactNode;
  showPublicLink: boolean;
  publicHref?: string;
  publicLabel: ReactNode;
  showSettingsLink: boolean;
  settingsHref?: string;
  settingsLabel: ReactNode;
  /** Buckets list (e.g. child buckets). When undefined or empty, buckets section is not rendered. */
  buckets?: BucketDetailBucket[];
  bucketsTitle?: string;
  /** When set, each bucket row shows CRUD actions: view (icon) plus optional edit/delete from the props below. */
  bucketViewLabel?: ReactNode;
  /** When set (client-only), each bucket row gets an edit button from this function. Prefer setting editHref on each bucket when calling from a Server Component. */
  bucketEditHref?: (bucket: BucketDetailBucket) => string;
  /** When set, each bucket row gets a delete button that calls this callback. */
  bucketOnDelete?: (bucket: BucketDetailBucket) => void;
  /** Aria-label for the edit button. */
  bucketEditLabel?: string;
  /** Aria-label for the delete button. */
  bucketDeleteLabel?: string;
  /** Optional custom actions for each bucket. When provided, overrides the built-in CrudButtons (bucketViewLabel + bucketEditHref + bucketOnDelete). */
  renderBucketActions?: (bucket: BucketDetailBucket) => ReactNode;
  createBucketHref?: string;
  createBucketLabel?: ReactNode;
  /** Column header for Name. Default: "Name". */
  bucketsColumnName?: ReactNode;
  /** Column header for Last Message. Default: "Last Message". */
  bucketsColumnLastMessage?: ReactNode;
  /** Column header for Created. Default: "Created". */
  bucketsColumnCreated?: ReactNode;
  /** Column header for Public. Default: "Public". */
  bucketsColumnPublic?: ReactNode;
  /** Column header for Actions. Default: "Actions". */
  bucketsColumnActions?: ReactNode;
  /** When false, hide actions column and row action cells in buckets table. Default: true. */
  showBucketActionsColumn?: boolean;
  /** Empty state message when there are no items in the list. Default: "No buckets yet." */
  bucketsEmptyMessage?: ReactNode;
  /** When set with bucketsSortOrder and bucketsSortBasePath, the buckets table has sortable Name, Last Message, Created columns. */
  bucketsSortBy?: string;
  /** Current sort order for the buckets table (used with bucketsSortBy and bucketsSortBasePath). */
  bucketsSortOrder?: 'asc' | 'desc';
  /** Base URL for the buckets tab (e.g. bucketDetailTabRoute(id, 'buckets')). Used with bucketsSortBy/bucketsSortOrder for sort navigation. */
  bucketsSortBasePath?: string;
  /** When set, buckets table sort is persisted in this cookie (path key bucket-detail-buckets) and restored when URL has no sortBy/sortOrder. */
  bucketsSortPrefsCookieName?: string;
  /** When false, do not wrap content in Container (e.g. when the page already wraps in Container). Default: true. */
  wrapInContainer?: boolean;
  /** When provided, render this instead of the default action buttons (Messages, Public, Settings). Use for tabbed layout. */
  actionArea?: ReactNode;
  /** When provided, render after header/details and before action area (useful for summary widgets). */
  preActionAreaSlot?: ReactNode;
  /** When provided, render below action area and above buckets. Use for Messages tab content. */
  messagesSlot?: ReactNode;
  /** Max width constraint for messagesSlot wrapper. Default: "readable". Set to "none" for full width. */
  messagesSlotMaxWidth?: 'readable' | 'none';
};

/**
 * Presentational bucket detail: name, detail items, action buttons (Messages, Public, Settings), optional buckets list.
 * Used by apps/web and apps/management-web to render the same owner-style bucket view.
 */
export function BucketDetailContent({
  bucketName,
  detailItems,
  showMessagesLink,
  messagesHref,
  messagesLabel,
  showPublicLink,
  publicHref,
  publicLabel,
  showSettingsLink,
  settingsHref,
  settingsLabel,
  buckets,
  bucketsTitle,
  bucketViewLabel,
  bucketEditHref,
  bucketOnDelete,
  bucketEditLabel,
  bucketDeleteLabel,
  renderBucketActions,
  createBucketHref,
  createBucketLabel,
  bucketsColumnName = 'Name',
  bucketsColumnLastMessage = 'Last Message',
  bucketsColumnCreated = 'Created',
  bucketsColumnPublic = 'Public',
  bucketsColumnActions = 'Actions',
  showBucketActionsColumn = true,
  bucketsEmptyMessage = 'No buckets yet.',
  bucketsSortBy,
  bucketsSortOrder,
  bucketsSortBasePath,
  bucketsSortPrefsCookieName,
  wrapInContainer = true,
  actionArea,
  preActionAreaSlot,
  messagesSlot,
  messagesSlotMaxWidth = 'readable',
}: BucketDetailContentProps) {
  const router = useRouter();
  const bucketsSortEnabled =
    bucketsSortBy !== undefined &&
    bucketsSortOrder !== undefined &&
    bucketsSortBasePath !== undefined &&
    bucketsSortBasePath !== '';

  const bucketsColumns: TableWithSortColumn[] = useMemo(() => {
    const cols: TableWithSortColumn[] = [
      {
        id: 'name',
        label: bucketsColumnName,
        sortable: true,
        sortKey: 'name',
        defaultSortOrder: 'asc',
        sortLabel: typeof bucketsColumnName === 'string' ? bucketsColumnName : 'Name',
      },
      {
        id: 'lastMessage',
        label: bucketsColumnLastMessage,
        sortable: true,
        sortKey: 'lastMessage',
        defaultSortOrder: 'desc',
        sortLabel:
          typeof bucketsColumnLastMessage === 'string' ? bucketsColumnLastMessage : 'Last Message',
      },
      {
        id: 'created',
        label: bucketsColumnCreated,
        sortable: true,
        sortKey: 'created',
        defaultSortOrder: 'desc',
        sortLabel: typeof bucketsColumnCreated === 'string' ? bucketsColumnCreated : 'Created',
      },
      { id: 'public', label: bucketsColumnPublic, sortable: false },
    ];
    if (showBucketActionsColumn) {
      cols.push({ id: 'actions', label: bucketsColumnActions, sortable: false });
    }
    return cols;
  }, [
    bucketsColumnName,
    bucketsColumnLastMessage,
    bucketsColumnCreated,
    bucketsColumnPublic,
    bucketsColumnActions,
    showBucketActionsColumn,
  ]);

  const buildBucketsSortUrl = useCallback(
    (sortByKey: string, sortOrderValue: 'asc' | 'desc'): string => {
      if (!bucketsSortBasePath) return '';
      const parts = bucketsSortBasePath.includes('?')
        ? bucketsSortBasePath.split('?', 2)
        : [bucketsSortBasePath, ''];
      const path = parts[0] ?? bucketsSortBasePath;
      const queryString = parts[1] ?? '';
      const params = new URLSearchParams(queryString);
      if (sortByKey === DEFAULT_BUCKETS_SORT_BY && sortOrderValue === DEFAULT_BUCKETS_SORT_ORDER) {
        params.delete('sortBy');
        params.delete('sortOrder');
      } else {
        params.set('sortBy', sortByKey);
        params.set('sortOrder', sortOrderValue);
      }
      const search = params.toString();
      return search !== '' ? `${path}?${search}` : path;
    },
    [bucketsSortBasePath]
  );

  const handleBucketsSortChange = useCallback(
    (sortKey: string, nextOrder: 'asc' | 'desc') => {
      if (!bucketsSortBasePath) return;
      const url = buildBucketsSortUrl(sortKey, nextOrder);
      if (url !== '') router.push(url);
    },
    [bucketsSortBasePath, buildBucketsSortUrl, router]
  );

  const getBucketActions = (bucket: BucketDetailBucket): ReactNode => {
    if (!showBucketActionsColumn) {
      return null;
    }
    if (renderBucketActions !== undefined) return renderBucketActions(bucket);
    const viewHref =
      bucketViewLabel !== undefined && bucketViewLabel !== null && bucketViewLabel !== ''
        ? bucket.href
        : undefined;
    const editHref = bucket.editHref ?? bucketEditHref?.(bucket);
    const hasDelete = bucketOnDelete !== undefined;
    const hasAny =
      (viewHref !== undefined && viewHref !== '') ||
      (editHref !== undefined && editHref !== '') ||
      hasDelete;
    if (!hasAny) return null;
    return (
      <CrudButtons
        viewHref={viewHref}
        viewLabel={typeof bucketViewLabel === 'string' ? bucketViewLabel : undefined}
        editHref={editHref !== undefined && editHref !== '' ? editHref : undefined}
        editLabel={bucketEditLabel}
        onDelete={hasDelete ? () => bucketOnDelete(bucket) : undefined}
        deleteLabel={bucketDeleteLabel}
      />
    );
  };
  const bucketsColumnCount = showBucketActionsColumn ? 5 : 4;
  const content = (
    <>
      <PageHeader title={bucketName} />
      <DataDetail items={detailItems} />
      {preActionAreaSlot !== undefined ? preActionAreaSlot : null}
      {actionArea !== undefined ? (
        actionArea
      ) : (
        <Row wrap>
          {showMessagesLink && messagesHref !== undefined && (
            <ButtonLink href={messagesHref} variant="secondary">
              {messagesLabel}
            </ButtonLink>
          )}
          {showPublicLink && publicHref !== undefined && (
            <ButtonLink
              href={publicHref}
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {publicLabel}
            </ButtonLink>
          )}
          {showSettingsLink && settingsHref !== undefined && (
            <ButtonLink href={settingsHref} variant="secondary">
              {settingsLabel}
            </ButtonLink>
          )}
        </Row>
      )}
      {messagesSlot !== undefined ? (
        messagesSlotMaxWidth === 'none' ? (
          <Stack>{messagesSlot}</Stack>
        ) : (
          <Stack maxWidth="readable">{messagesSlot}</Stack>
        )
      ) : null}
      {buckets !== undefined && bucketsTitle !== undefined && (
        <SectionWithHeading
          title={bucketsTitle}
          headingAction={
            createBucketHref !== undefined && createBucketLabel !== undefined ? (
              <ButtonLink href={createBucketHref} variant="primary">
                {createBucketLabel}
              </ButtonLink>
            ) : undefined
          }
        >
          <Table.ScrollContainer>
            {bucketsSortEnabled ? (
              <TableWithSort
                className={styles.bucketsTable}
                columns={bucketsColumns}
                sortBy={bucketsSortBy}
                sortOrder={bucketsSortOrder}
                onSortChange={handleBucketsSortChange}
                sortPrefsCookieName={
                  bucketsSortPrefsCookieName !== undefined &&
                  bucketsSortPrefsCookieName.trim() !== ''
                    ? bucketsSortPrefsCookieName
                    : undefined
                }
                sortPrefsListKey={
                  bucketsSortPrefsCookieName !== undefined &&
                  bucketsSortPrefsCookieName.trim() !== ''
                    ? 'bucket-detail-buckets'
                    : undefined
                }
                getSortUrl={
                  bucketsSortPrefsCookieName !== undefined &&
                  bucketsSortPrefsCookieName.trim() !== ''
                    ? buildBucketsSortUrl
                    : undefined
                }
                defaultSortBy={
                  bucketsSortPrefsCookieName !== undefined &&
                  bucketsSortPrefsCookieName.trim() !== ''
                    ? DEFAULT_BUCKETS_SORT_BY
                    : undefined
                }
                defaultSortOrder={
                  bucketsSortPrefsCookieName !== undefined &&
                  bucketsSortPrefsCookieName.trim() !== ''
                    ? DEFAULT_BUCKETS_SORT_ORDER
                    : undefined
                }
              >
                <Table.Body>
                  {buckets.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={bucketsColumnCount}>{bucketsEmptyMessage}</Table.Cell>
                    </Table.Row>
                  ) : (
                    buckets.map((bucket) => (
                      <Table.Row key={bucket.id}>
                        <Table.Cell>
                          <Link href={bucket.href} className={styles.nameCellLink} tabIndex={0}>
                            {bucket.name}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>
                          {bucket.lastMessageAtDisplay !== undefined &&
                          bucket.lastMessageAtDisplay !== null &&
                          bucket.lastMessageAtDisplay !== ''
                            ? bucket.lastMessageAtDisplay
                            : '—'}
                        </Table.Cell>
                        <Table.Cell>{bucket.createdAtDisplay}</Table.Cell>
                        <Table.Cell>
                          {bucket.isPublicDisplay !== undefined && bucket.isPublicDisplay !== null
                            ? bucket.isPublicDisplay
                            : '—'}
                        </Table.Cell>
                        {showBucketActionsColumn ? (
                          <Table.Cell>
                            <div className={styles.actionsCell}>{getBucketActions(bucket)}</div>
                          </Table.Cell>
                        ) : null}
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </TableWithSort>
            ) : (
              <Table className={styles.bucketsTable}>
                <Table.Head>
                  <Table.Row>
                    <Table.HeaderCell>{bucketsColumnName}</Table.HeaderCell>
                    <Table.HeaderCell>{bucketsColumnLastMessage}</Table.HeaderCell>
                    <Table.HeaderCell>{bucketsColumnCreated}</Table.HeaderCell>
                    <Table.HeaderCell>{bucketsColumnPublic}</Table.HeaderCell>
                    {showBucketActionsColumn ? (
                      <Table.HeaderCell>{bucketsColumnActions}</Table.HeaderCell>
                    ) : null}
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {buckets.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={bucketsColumnCount}>{bucketsEmptyMessage}</Table.Cell>
                    </Table.Row>
                  ) : (
                    buckets.map((bucket) => (
                      <Table.Row key={bucket.id}>
                        <Table.Cell>
                          <Link href={bucket.href} className={styles.nameCellLink} tabIndex={0}>
                            {bucket.name}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>
                          {bucket.lastMessageAtDisplay !== undefined &&
                          bucket.lastMessageAtDisplay !== null &&
                          bucket.lastMessageAtDisplay !== ''
                            ? bucket.lastMessageAtDisplay
                            : '—'}
                        </Table.Cell>
                        <Table.Cell>{bucket.createdAtDisplay}</Table.Cell>
                        <Table.Cell>
                          {bucket.isPublicDisplay !== undefined && bucket.isPublicDisplay !== null
                            ? bucket.isPublicDisplay
                            : '—'}
                        </Table.Cell>
                        {showBucketActionsColumn ? (
                          <Table.Cell>
                            <div className={styles.actionsCell}>{getBucketActions(bucket)}</div>
                          </Table.Cell>
                        ) : null}
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table>
            )}
          </Table.ScrollContainer>
        </SectionWithHeading>
      )}
    </>
  );
  return wrapInContainer ? <Container>{content}</Container> : content;
}
