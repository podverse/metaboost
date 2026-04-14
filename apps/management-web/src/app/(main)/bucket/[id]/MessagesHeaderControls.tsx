'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { CheckboxField, Row } from '@metaboost/ui';

import { MessagesSortSelect } from './MessagesSortSelect';

import styles from './MessagesHeaderControls.module.scss';

type MessagesHeaderControlsProps = {
  sort: 'recent' | 'oldest';
  basePath: string;
  label: string;
  sortOptionLabels: {
    recent: string;
    oldest: string;
  };
  sortPrefsCookieName: string;
  filtersButtonAriaLabel: string;
  showPartiallyVerifiedMessagesLabel: string;
  showUnverifiedMessagesLabel: string;
  includePartiallyVerified: boolean;
  includeUnverified: boolean;
};

export function MessagesHeaderControls({
  sort,
  basePath,
  label,
  sortOptionLabels,
  sortPrefsCookieName,
  filtersButtonAriaLabel,
  showPartiallyVerifiedMessagesLabel,
  showUnverifiedMessagesLabel,
  includePartiallyVerified,
  includeUnverified,
}: MessagesHeaderControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        filtersWrapperRef.current !== null &&
        !filtersWrapperRef.current.contains(event.target as Node)
      ) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filtersOpen]);

  const updateFilters = (next: {
    includePartiallyVerified: boolean;
    includeUnverified: boolean;
  }): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'messages');
    if (next.includePartiallyVerified) {
      params.set('includePartiallyVerified', '1');
    } else {
      params.delete('includePartiallyVerified');
    }
    if (next.includeUnverified) {
      params.set('includeUnverified', '1');
    } else {
      params.delete('includeUnverified');
    }
    params.delete('page');
    const query = params.toString();
    const href = query === '' ? pathname : `${pathname}?${query}`;
    router.push(href);
  };

  const onIncludePartiallyVerifiedChange = (checked: boolean): void => {
    updateFilters({
      includePartiallyVerified: checked,
      includeUnverified: checked ? includeUnverified : false,
    });
  };

  const onIncludeUnverifiedChange = (checked: boolean): void => {
    updateFilters({
      includePartiallyVerified: checked ? true : includePartiallyVerified,
      includeUnverified: checked,
    });
  };

  return (
    <Row className={styles.controlsRow}>
      <MessagesSortSelect
        sort={sort}
        basePath={basePath}
        queryParams={{
          tab: 'messages',
          ...(includePartiallyVerified ? { includePartiallyVerified: '1' } : {}),
          ...(includeUnverified ? { includeUnverified: '1' } : {}),
        }}
        label={label}
        sortOptionLabels={sortOptionLabels}
        sortPrefsCookieName={sortPrefsCookieName}
      />
      <div className={styles.filtersMenuWrapper} ref={filtersWrapperRef}>
        <button
          type="button"
          className={styles.filtersButton}
          aria-label={filtersButtonAriaLabel}
          aria-expanded={filtersOpen}
          aria-haspopup="menu"
          onClick={() => setFiltersOpen((current) => !current)}
        >
          <i className="fa-solid fa-gear" aria-hidden />
        </button>
        {filtersOpen ? (
          <div className={styles.filtersMenu} role="menu" aria-label={filtersButtonAriaLabel}>
            <CheckboxField
              label={showPartiallyVerifiedMessagesLabel}
              checked={includePartiallyVerified}
              onChange={onIncludePartiallyVerifiedChange}
            />
            <CheckboxField
              label={showUnverifiedMessagesLabel}
              checked={includeUnverified}
              onChange={onIncludeUnverifiedChange}
              disabled={!includePartiallyVerified}
            />
          </div>
        ) : null}
      </div>
    </Row>
  );
}
