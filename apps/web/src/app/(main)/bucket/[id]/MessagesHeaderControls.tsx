'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
  showUnverifiedMessagesLabel: string;
  includeUnverified: boolean;
  showUnverifiedControl: boolean;
};

export function MessagesHeaderControls({
  sort,
  basePath,
  label,
  sortOptionLabels,
  sortPrefsCookieName,
  filtersButtonAriaLabel,
  showUnverifiedMessagesLabel,
  includeUnverified,
  showUnverifiedControl,
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

  const onIncludeUnverifiedChange = (checked: boolean): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'messages');
    if (checked) {
      params.set('includeUnverified', '1');
    } else {
      params.delete('includeUnverified');
    }
    params.delete('page');
    const query = params.toString();
    const href = query === '' ? pathname : `${pathname}?${query}`;
    router.push(href);
  };

  return (
    <Row className={styles.controlsRow}>
      <MessagesSortSelect
        sort={sort}
        basePath={basePath}
        queryParams={{ tab: 'messages', ...(includeUnverified ? { includeUnverified: '1' } : {}) }}
        label={label}
        sortOptionLabels={sortOptionLabels}
        sortPrefsCookieName={sortPrefsCookieName}
      />
      {showUnverifiedControl ? (
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
                label={showUnverifiedMessagesLabel}
                checked={includeUnverified}
                onChange={onIncludeUnverifiedChange}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </Row>
  );
}
