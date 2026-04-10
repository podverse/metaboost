'use client';

import { useTranslations } from 'next-intl';

import { Button } from '../../form/Button';
import { Modal } from '../Modal';

import styles from './ConfirmDeleteModal.module.scss';

export type ConfirmDeleteModalProps = {
  open: boolean;
  displayName: string;
  /** e.g. 'common.confirmDeleteBucket'. Must provide message, fallbackName, cancel, delete. */
  translationKeyPrefix: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** When true, disables actions and indicates confirm in progress. */
  confirmLoading?: boolean;
};

export function ConfirmDeleteModal({
  open,
  displayName,
  translationKeyPrefix,
  onConfirm,
  onCancel,
  confirmLoading = false,
}: ConfirmDeleteModalProps) {
  const t = useTranslations(translationKeyPrefix);

  if (!open) {
    return null;
  }

  return (
    <Modal withBackdrop backdropOpaque onClose={confirmLoading ? undefined : onCancel}>
      <div className={styles.body}>
        <p className={styles.message}>
          {t('message', { name: displayName !== '' ? displayName : t('fallbackName') })}
        </p>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={confirmLoading}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            className={styles.deleteButton}
            onClick={onConfirm}
            disabled={confirmLoading}
            loading={confirmLoading}
          >
            {t('delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
