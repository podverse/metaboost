import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

import styles from './Table.module.scss';

export type TableScrollContainerProps = HTMLAttributes<HTMLDivElement>;

function TableScrollContainer({ className = '', children, ...props }: TableScrollContainerProps) {
  return (
    <div className={`${styles.scrollContainer} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export type TableProps = HTMLAttributes<HTMLTableElement>;

export function Table({ className = '', ...props }: TableProps) {
  return <table className={`${styles.root} ${className}`.trim()} {...props} />;
}

export type TableHeadProps = HTMLAttributes<HTMLTableSectionElement>;

function TableHead({ className = '', ...props }: TableHeadProps) {
  return <thead className={className} {...props} />;
}

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

function TableBody({ className = '', ...props }: TableBodyProps) {
  return <tbody className={`${styles.body} ${className}`.trim()} {...props} />;
}

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

function TableRow({ className = '', ...props }: TableRowProps) {
  return <tr className={className} {...props} />;
}

export type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement>;

function TableHeaderCell({ className = '', scope = 'col', ...props }: TableHeaderCellProps) {
  return <th className={`${styles.headerCell} ${className}`.trim()} scope={scope} {...props} />;
}

export type TableSortableHeaderCellProps = {
  sortKey: string;
  label: string;
  activeSortBy: string | undefined;
  sortOrder: 'asc' | 'desc';
  onSort: (sortKey: string) => void;
  scope?: 'col';
  className?: string;
};

function TableSortableHeaderCell({
  sortKey,
  label,
  activeSortBy,
  sortOrder,
  onSort,
  scope = 'col',
  className = '',
}: TableSortableHeaderCellProps) {
  const isActive = activeSortBy === sortKey;
  const handleClick = () => onSort(sortKey);
  const ariaSort = isActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined;
  return (
    <th
      className={`${styles.headerCell} ${styles.sortableHeaderCell} ${className}`.trim()}
      scope={scope}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        className={styles.sortableHeaderButton}
        onClick={handleClick}
        aria-label={`Sort by ${label}. ${isActive ? (sortOrder === 'asc' ? 'Ascending. Click for descending.' : 'Descending. Click for ascending.') : 'Click to sort.'}`}
      >
        <span className={styles.sortableHeaderLabel}>{label}</span>
        {isActive ? (
          <span className={styles.sortableHeaderIcon} aria-hidden>
            {sortOrder === 'asc' ? (
              <i className="fa-solid fa-sort-up" />
            ) : (
              <i className="fa-solid fa-sort-down" />
            )}
          </span>
        ) : (
          <span className={styles.sortableHeaderIcon} aria-hidden>
            <i className="fa-solid fa-sort" />
          </span>
        )}
      </button>
    </th>
  );
}

export type TableCellProps = TdHTMLAttributes<HTMLTableDataCellElement>;

function TableCell({ className = '', ...props }: TableCellProps) {
  return <td className={`${styles.cell} ${className}`.trim()} {...props} />;
}

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeaderCell = TableHeaderCell;
Table.SortableHeaderCell = TableSortableHeaderCell;
Table.Cell = TableCell;
Table.ScrollContainer = TableScrollContainer;
