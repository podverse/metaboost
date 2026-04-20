'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';

import { Button } from '../../form/Button/Button';
import { GoToPageModal, type GoToPageModalProps } from './GoToPageModal';

import styles from './Pagination.module.scss';

export type PaginationProps = {
  /** Current 1-based page. */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Base path for links (e.g. /admins or /events). No trailing slash. */
  basePath: string;
  /** Current page size. Used to build URL when not equal to defaultLimit. */
  limit: number;
  /** Default page size; when limit equals this, limit is omitted from URL. */
  defaultLimit: number;
  /** Optional query params to include in every pagination URL (e.g. sort=oldest). */
  queryParams?: Record<string, string>;
  /**
   * When set, pagination uses buttons + this callback instead of URL navigation
   * (cookie-backed list state + router.refresh pattern).
   */
  refreshOnPage?: (page: number) => void;
  /** When set, go-to-page modal only allows 1..maxGoToPage and shows e.g. "Pages 1 to 500 of 500+". Next/Prev still use real totalPages. */
  maxGoToPage?: number;
  /** Optional labels for the bar and modal. */
  labels?: {
    previous?: string;
    next?: string;
    goToPage?: string;
    goToPageModal?: GoToPageModalProps['labels'];
  };
};

function buildPageUrl(
  basePath: string,
  page: number,
  limit: number,
  defaultLimit: number,
  queryParams?: Record<string, string>
): string {
  const params = new URLSearchParams();
  if (queryParams !== undefined) {
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined && v !== '') params.set(k, v);
    }
  }
  // Always set target page so links (e.g. page 1) overwrite current page from queryParams
  if (page > 1) {
    params.set('page', String(page));
  } else {
    params.delete('page');
  }
  if (limit !== defaultLimit) params.set('limit', String(limit));
  const q = params.toString();
  return q ? `${basePath}?${q}` : basePath;
}

const PAGES_VISIBLE = 5;

/** Returns up to PAGES_VISIBLE page numbers in a sliding window centered on current when possible. */
function pageRange(current: number, total: number): number[] {
  if (total <= PAGES_VISIBLE) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  let start = Math.max(1, current - Math.floor(PAGES_VISIBLE / 2));
  const end = Math.min(total, start + PAGES_VISIBLE - 1);
  if (end - start + 1 < PAGES_VISIBLE) {
    start = Math.max(1, end - PAGES_VISIBLE + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  limit,
  defaultLimit,
  queryParams,
  refreshOnPage,
  maxGoToPage,
  labels = {},
}: PaginationProps) {
  const t = useTranslations('ui.pagination');
  const [goToPageOpen, setGoToPageOpen] = useState(false);
  const goToPage = labels.goToPage ?? t('goToPage');

  const effectiveGoToTotalPages =
    maxGoToPage !== undefined && totalPages > maxGoToPage ? maxGoToPage : totalPages;
  const goToPageModalLabels =
    maxGoToPage !== undefined && totalPages > maxGoToPage
      ? {
          ...labels.goToPageModal,
          rangeText: t('pagesRangeOf', { max: effectiveGoToTotalPages }),
        }
      : labels.goToPageModal;

  const getPageUrl = (page: number) =>
    buildPageUrl(basePath, page, limit, defaultLimit, queryParams);

  const pages = useMemo(() => pageRange(currentPage, totalPages), [currentPage, totalPages]);

  const handleGoToPage = (page: number) => {
    if (refreshOnPage !== undefined) {
      refreshOnPage(page);
      return;
    }
    const url = getPageUrl(page);
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  if (totalPages < 1) return null;

  const PageNavControl = ({
    targetPage,
    ariaLabel,
    iconClass,
    disabled,
  }: {
    targetPage: number;
    ariaLabel: string;
    iconClass: string;
    disabled: boolean;
  }) => {
    if (disabled) {
      return (
        <span className={styles.iconButtonDisabled} aria-disabled="true">
          <i className={iconClass} aria-hidden />
        </span>
      );
    }
    if (refreshOnPage !== undefined) {
      return (
        <button
          type="button"
          className={styles.iconButton}
          aria-label={ariaLabel}
          onClick={() => {
            refreshOnPage(targetPage);
          }}
        >
          <i className={iconClass} aria-hidden />
        </button>
      );
    }
    return (
      <a href={getPageUrl(targetPage)} className={styles.iconButton} aria-label={ariaLabel}>
        <i className={iconClass} aria-hidden />
      </a>
    );
  };

  return (
    <>
      <nav className={styles.bar} aria-label={t('ariaPagination')}>
        <div className={styles.controls}>
          <PageNavControl
            targetPage={1}
            ariaLabel={t('ariaFirstPage')}
            iconClass="fa-solid fa-angles-left"
            disabled={currentPage <= 1}
          />
          <PageNavControl
            targetPage={currentPage - 1}
            ariaLabel={t('ariaPreviousPage')}
            iconClass="fa-solid fa-chevron-left"
            disabled={currentPage <= 1}
          />
          <span className={styles.pageList}>
            {pages.map((p) =>
              p === currentPage ? (
                <span key={p} className={styles.pageCurrent} aria-current="page">
                  {p}
                </span>
              ) : refreshOnPage !== undefined ? (
                <button
                  key={p}
                  type="button"
                  className={styles.pageLink}
                  onClick={() => {
                    refreshOnPage(p);
                  }}
                >
                  {p}
                </button>
              ) : (
                <a key={p} href={getPageUrl(p)} className={styles.pageLink}>
                  {p}
                </a>
              )
            )}
          </span>
          <PageNavControl
            targetPage={currentPage + 1}
            ariaLabel={t('ariaNextPage')}
            iconClass="fa-solid fa-chevron-right"
            disabled={currentPage >= totalPages}
          />
          <PageNavControl
            targetPage={totalPages}
            ariaLabel={t('ariaLastPage')}
            iconClass="fa-solid fa-angles-right"
            disabled={currentPage >= totalPages}
          />
        </div>
        <div className={styles.goToPageWrap}>
          <Button
            type="button"
            variant="link"
            className={styles.goToPageButton}
            onClick={() => setGoToPageOpen(true)}
          >
            {goToPage}
          </Button>
        </div>
      </nav>
      <GoToPageModal
        open={goToPageOpen}
        totalPages={effectiveGoToTotalPages}
        currentPage={currentPage}
        onGo={handleGoToPage}
        onClose={() => setGoToPageOpen(false)}
        labels={goToPageModalLabels}
      />
    </>
  );
}
