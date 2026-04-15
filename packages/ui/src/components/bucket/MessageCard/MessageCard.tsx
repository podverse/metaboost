'use client';

import { useTranslations } from 'next-intl';

import { Card } from '../../layout/Card/Card';

import styles from './MessageCard.module.scss';

export type MessageCardProps = {
  senderName: string | null;
  createdAt: string;
  body: string;
  metadataItems?: Array<{ label: string; value: string }>;
  detailsSections?: Array<{
    title: string;
    items: Array<{ label: string; value: string }>;
  }>;
  detailsOpenLabel?: string;
  detailsCloseLabel?: string;
  anonymousLabel?: string;
  /** When true, show public/private icon in header. */
  showPublicPrivate?: boolean;
  isPublic?: boolean;
  /** 'full' shows full body with pre-wrap; 'snippet' truncates to ~80 chars. */
  bodyVariant: 'full' | 'snippet';
  verificationStatus?: {
    iconClassName: string;
    label: string;
    tone: 'success' | 'info' | 'warning' | 'danger';
  };
  className?: string;
};

function snippet(body: string, max = 80): string {
  return body.length <= max ? body : body.slice(0, max) + '…';
}

export function MessageCard({
  senderName,
  createdAt,
  body,
  metadataItems = [],
  detailsSections = [],
  detailsOpenLabel,
  detailsCloseLabel,
  anonymousLabel,
  showPublicPrivate = false,
  isPublic = false,
  bodyVariant,
  verificationStatus,
  className = '',
}: MessageCardProps) {
  const t = useTranslations('buckets');
  const sender =
    senderName !== null && senderName !== '' ? senderName : (anonymousLabel ?? t('anonymous'));
  const populatedDetailsSections = detailsSections.filter((section) => section.items.length > 0);
  const showDetails = populatedDetailsSections.length > 0;

  return (
    <Card variant="surface" className={`${styles.root} ${className}`.trim()}>
      <div className={styles.headerRow}>
        <span className={styles.senderName}>{sender}</span>
        <span className={styles.meta}>
          {showPublicPrivate && (
            <span
              className={styles.publicPrivateIcon}
              title={isPublic ? t('publicLabel') : t('privateLabel')}
              aria-label={isPublic ? t('publicLabel') : t('privateLabel')}
            >
              <i className={isPublic ? 'fa-solid fa-globe' : 'fa-solid fa-lock'} aria-hidden />
            </span>
          )}
          <span>{new Date(createdAt).toLocaleString()}</span>
        </span>
      </div>
      {bodyVariant === 'full' ? (
        <div className={styles.bodyFull}>{body}</div>
      ) : (
        <div className={styles.bodySnippet}>{snippet(body)}</div>
      )}
      {verificationStatus !== undefined ? (
        <div
          className={`${styles.verificationStatus} ${styles[`verificationTone_${verificationStatus.tone}`]}`}
        >
          <i className={verificationStatus.iconClassName} aria-hidden />
          <span>{verificationStatus.label}</span>
        </div>
      ) : null}
      {showDetails ? (
        <details className={styles.detailsDisclosure}>
          <summary>
            {detailsOpenLabel ?? t('verificationDetails.open')}
            <span className={styles.detailsCloseText}>
              {detailsCloseLabel ?? t('verificationDetails.close')}
            </span>
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
      {metadataItems.length > 0 ? (
        <dl className={styles.metadataList}>
          {metadataItems.map((item) => (
            <div key={`${item.label}-${item.value}`} className={styles.metadataRow}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Card>
  );
}
