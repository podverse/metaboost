'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { Input } from '../../form/Input';

import styles from './TableFilterBar.module.scss';

export type TableFilterBarColumn = {
  id: string;
  label: string;
  /** Optional per-column link; when set, this column's cell is a link to the returned href. Use for columns that link somewhere other than the main view route (e.g. a "public" column linking to a public page). */
  getHref?: (row: { id: string; cells: Record<string, string> }) => string | undefined;
  /** When set, used as the sortBy value in the URL/API instead of column id (e.g. when API expects a different field name). */
  sortKey?: string;
  /** Default sort order when this column is the active sort and URL has no sortOrder. String columns typically 'asc', date columns 'desc', number 'asc'. Omit for legacy desc. */
  defaultSortOrder?: 'asc' | 'desc';
};

export type TableFilterBarProps = {
  /** Current search value (case-insensitive match applied by consumer). */
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Column definitions; IDs are used for selectedColumnIds. */
  columns: TableFilterBarColumn[];
  /** Which column IDs are included in the search. */
  selectedColumnIds: string[];
  onSelectedColumnIdsChange: (ids: string[]) => void;
  /** Placeholder for the search input. */
  placeholder?: string;
  /** Label for the column-picker popover (e.g. "Search in columns"). */
  filterColumnsLabel?: string;
  /** Accessible label for the funnel button. */
  funnelButtonLabel?: string;
};

export function TableFilterBar({
  searchValue,
  onSearchChange,
  columns,
  selectedColumnIds,
  onSelectedColumnIdsChange,
  placeholder,
  filterColumnsLabel,
  funnelButtonLabel,
}: TableFilterBarProps) {
  const t = useTranslations('ui.tableFilterBar');
  const effectivePlaceholder = placeholder ?? t('placeholder');
  const effectiveFilterColumnsLabel = filterColumnsLabel ?? t('filterColumnsLabel');
  const effectiveFunnelButtonLabel = funnelButtonLabel ?? t('funnelButtonLabel');

  const [popoverOpen, setPopoverOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const closePopover = useCallback(() => setPopoverOpen(false), []);

  useEffect(() => {
    if (!popoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current !== null && !wrapperRef.current.contains(e.target as Node)) {
        closePopover();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen, closePopover]);

  const handleToggleColumn = (id: string) => {
    const set = new Set(selectedColumnIds);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    const next = Array.from(set);
    if (next.length > 0) {
      onSelectedColumnIdsChange(next);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closePopover();
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.bar}>
        <Input
          type="search"
          value={searchValue}
          onChange={onSearchChange}
          placeholder={effectivePlaceholder}
          aria-label={effectivePlaceholder}
          className={styles.input}
        />
        <button
          type="button"
          className={styles.funnelButton}
          onClick={() => setPopoverOpen((prev) => !prev)}
          aria-expanded={popoverOpen}
          aria-haspopup="dialog"
          aria-label={effectiveFunnelButtonLabel}
          title={effectiveFunnelButtonLabel}
        >
          <i className="fa-solid fa-filter" aria-hidden />
        </button>
      </div>
      {popoverOpen && (
        <div
          className={styles.popover}
          role="dialog"
          aria-label={effectiveFilterColumnsLabel}
          onKeyDown={handleKeyDown}
        >
          <p className={styles.popoverTitle}>{effectiveFilterColumnsLabel}</p>
          <div className={styles.checkboxList}>
            {columns.map((col) => {
              const checked = selectedColumnIds.includes(col.id);
              return (
                <label key={col.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleColumn(col.id)}
                    className={styles.checkbox}
                  />
                  <span>{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
