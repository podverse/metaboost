'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { Stack } from '../../layout/Stack/Stack';
import { Text } from '../../layout/Text/Text';
import { Modal } from './Modal';

import styles from './RateLimitModal.module.scss';

export type RateLimitModalProps = {
  open: boolean;
  onClose: () => void;
  /** Seconds until the user can retry; when absent, a generic message is shown. */
  retryAfterSeconds?: number;
};

/**
 * Standardized modal shown when an action is rate-limited (429). Displays how long
 * until the user can try again. Content has consistent padding; backdrop is opaque for readability.
 */
export function RateLimitModal({ open, onClose, retryAfterSeconds }: RateLimitModalProps) {
  const t = useTranslations('ui.rateLimitModal');
  const bodyMessage = useMemo(() => {
    if (
      retryAfterSeconds !== undefined &&
      retryAfterSeconds !== null &&
      Number.isFinite(retryAfterSeconds) &&
      retryAfterSeconds > 0
    ) {
      const secs = Math.ceil(retryAfterSeconds);
      const time =
        secs >= 60
          ? t('timeMinutes', { count: Math.ceil(secs / 60) })
          : t('timeSeconds', { count: secs });
      return t('bodyWithTime', { time });
    }
    return t('bodyFallback');
  }, [retryAfterSeconds, t]);

  if (!open) return null;

  return (
    <Modal withBackdrop backdropOpaque onClose={onClose}>
      <div className={styles.contentBox}>
        <Stack>
          <h2 className={styles.title}>{t('title')}</h2>
          <Text>{bodyMessage}</Text>
        </Stack>
      </div>
    </Modal>
  );
}
