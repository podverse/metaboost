'use client';

import { useTranslations } from 'next-intl';

import { Card } from '../../layout/Card/Card';
import { CaretMenuDropdown, type DropdownItem } from '../../navigation/Dropdown';
import { Link } from '../../navigation/Link/Link';

import styles from './MessageCard.module.scss';

export type MessageCardProps = {
  senderName: string | null;
  createdAt: string;
  body: string;
  amountLine?: string | null;
  appName?: string | null;
  detailsSections?: Array<{
    title: string;
    items: Array<{ label: string; value: string }>;
  }>;
  detailsOpenLabel?: string;
  detailsCloseLabel?: string;
  miniBreadcrumbItems?: Array<{ label: string; href: string }>;
  anonymousLabel?: string;
  /** 'full' shows full body with pre-wrap; 'snippet' truncates to ~80 chars. */
  bodyVariant: 'full' | 'snippet';
  verificationStatus?: {
    iconClassName: string;
    label: string;
    tone: 'success' | 'info' | 'warning' | 'danger';
  };
  /** Caret menu in the card header with optional Block sender and Delete (e.g. bucket messages tab). */
  overflowMenu?: {
    deleteLabel: string;
    onDelete: () => void;
    blockSender?: {
      label: string;
      onBlock: () => void;
    };
  };
  /**
   * When the overflow menu is shown, vertically center the caret in the header column (useful when
   * the sender block wraps). Defaults to true. Set false to keep the prior inline alignment.
   */
  overflowCaretVerticalCenter?: boolean;
  className?: string;
};

function snippet(body: string, max = 80): string {
  return body.length <= max ? body : body.slice(0, max) + '…';
}

export function MessageCard({
  senderName,
  createdAt,
  body,
  amountLine,
  appName,
  detailsSections = [],
  detailsOpenLabel,
  detailsCloseLabel,
  miniBreadcrumbItems = [],
  anonymousLabel,
  bodyVariant,
  verificationStatus,
  overflowMenu,
  overflowCaretVerticalCenter,
  className = '',
}: MessageCardProps) {
  const t = useTranslations('buckets');
  const sender =
    senderName !== null && senderName !== '' ? senderName : (anonymousLabel ?? t('anonymous'));
  const populatedDetailsSections = detailsSections.filter((section) => section.items.length > 0);
  const showDetails = populatedDetailsSections.length > 0;
  const hasMiniBreadcrumb = miniBreadcrumbItems.length > 0;
  const hasAmountLine = amountLine !== undefined && amountLine !== null && amountLine !== '';
  const hasAppName = appName !== undefined && appName !== null && appName !== '';
  const showSummaryRow = hasAmountLine || hasAppName || verificationStatus !== undefined;

  const centerCaretInHeader = overflowMenu !== undefined && (overflowCaretVerticalCenter ?? true);

  const overflowItems: DropdownItem[] = [];
  if (overflowMenu?.blockSender !== undefined) {
    overflowItems.push({
      type: 'button',
      label: overflowMenu.blockSender.label,
      onClick: overflowMenu.blockSender.onBlock,
    });
  }
  if (overflowMenu !== undefined) {
    overflowItems.push({
      type: 'button',
      label: overflowMenu.deleteLabel,
      onClick: overflowMenu.onDelete,
    });
  }

  return (
    <Card variant="surface" className={`${styles.root} ${className}`.trim()}>
      {hasMiniBreadcrumb ? (
        <div className={styles.miniBreadcrumbRow} aria-label={t('messages')}>
          {miniBreadcrumbItems.map((item, index) => (
            <span key={`${item.href}-${item.label}`} className={styles.miniBreadcrumbItem}>
              {index > 0 ? <span className={styles.miniBreadcrumbSeparator}>&gt;</span> : null}
              <Link href={item.href} className={styles.miniBreadcrumbLink}>
                {item.label}
              </Link>
            </span>
          ))}
        </div>
      ) : null}
      <div className={styles.headerMain}>
        <span className={styles.senderName}>{sender}</span>
        <span
          className={`${styles.meta} ${centerCaretInHeader ? styles.metaStretchForCaret : ''}`.trim()}
        >
          <span>{new Date(createdAt).toLocaleString()}</span>
          {overflowMenu !== undefined ? (
            <span
              className={`${styles.overflowMenuWrap} ${centerCaretInHeader ? styles.overflowMenuWrapStretch : ''}`.trim()}
            >
              <CaretMenuDropdown
                aria-label={t('messageMenuAriaLabel')}
                centerTriggerVertically={centerCaretInHeader}
                items={overflowItems}
              />
            </span>
          ) : null}
        </span>
      </div>
      {showSummaryRow ? (
        <div className={styles.summaryRow}>
          <div className={styles.summaryLeft}>
            {hasAmountLine ? <div className={styles.amountLine}>{amountLine}</div> : null}
            {hasAppName ? <div className={styles.appName}>{appName}</div> : null}
          </div>
          {verificationStatus !== undefined ? (
            <div
              className={`${styles.verificationStatus} ${styles[`verificationTone_${verificationStatus.tone}`]}`}
            >
              <i className={verificationStatus.iconClassName} aria-hidden />
              <span>{verificationStatus.label}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {bodyVariant === 'full' ? (
        <div className={styles.bodyFull}>{body}</div>
      ) : (
        <div className={styles.bodySnippet}>{snippet(body)}</div>
      )}
      {showDetails ? (
        <details className={styles.detailsDisclosure}>
          <summary>
            <span className={styles.detailsOpenText}>
              {detailsOpenLabel ?? t('messageDetails.show')}
            </span>
            <span className={styles.detailsCloseText}>
              {detailsCloseLabel ?? t('messageDetails.hide')}
            </span>
            <i className={`fa-solid fa-chevron-down ${styles.detailsCaret}`} aria-hidden />
          </summary>
          {populatedDetailsSections.map((section) => (
            <section key={section.title} className={styles.detailsSection}>
              <h4 className={styles.detailsSectionTitle}>{section.title}</h4>
              <dl className={styles.detailsSectionList}>
                {section.items.map((item) => (
                  <div
                    key={`${section.title}-${item.label}-${item.value}`}
                    className={styles.metadataRow}
                  >
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </details>
      ) : null}
    </Card>
  );
}
