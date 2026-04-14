'use client';

import { useTranslations } from 'next-intl';

import { Card } from '../../layout/Card/Card';

import styles from './MessageCard.module.scss';

export type MessageCardProps = {
  senderName: string | null;
  createdAt: string;
  body: string;
  metadataItems?: Array<{ label: string; value: string }>;
  anonymousLabel?: string;
  /** When true, show public/private icon in header. */
  showPublicPrivate?: boolean;
  isPublic?: boolean;
  /** 'full' shows full body with pre-wrap; 'snippet' truncates to ~80 chars. */
  bodyVariant: 'full' | 'snippet';
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
  anonymousLabel,
  showPublicPrivate = false,
  isPublic = false,
  bodyVariant,
  className = '',
}: MessageCardProps) {
  const t = useTranslations('buckets');
  const sender =
    senderName !== null && senderName !== '' ? senderName : (anonymousLabel ?? t('anonymous'));

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
