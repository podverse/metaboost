'use client';

import { useTranslations } from 'next-intl';
import { useState, useId, useEffect } from 'react';

import { Button } from '../../form/Button/Button';
import { Input } from '../../form/Input/Input';
import { Modal } from '../../modal/Modal/Modal';

import styles from './Pagination.module.scss';

export type GoToPageModalProps = {
  open: boolean;
  totalPages: number;
  currentPage: number;
  onGo: (page: number) => void;
  onClose: () => void;
  labels?: {
    title?: string;
    pageLabel?: string;
    rangeText?: string;
    submitLabel?: string;
    closeLabel?: string;
  };
};

export function GoToPageModal({
  open,
  totalPages,
  currentPage,
  onGo,
  onClose,
  labels = {},
}: GoToPageModalProps) {
  const t = useTranslations('ui.pagination.goToPageModal');
  const title = labels.title ?? t('title');
  const pageLabel = labels.pageLabel ?? t('pageLabel');
  const submitLabel = labels.submitLabel ?? t('submitLabel');
  const closeLabel = labels.closeLabel ?? t('closeLabel');

  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  useEffect(() => {
    if (open) setValue(String(currentPage));
  }, [open, currentPage]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = Number.parseInt(value.trim(), 10);
    if (Number.isNaN(num) || num < 1 || num > totalPages) {
      setError(t('pageBetween', { totalPages }));
      return;
    }
    onGo(num);
    onClose();
    setValue('');
  };

  const handleClose = () => {
    setError(null);
    setValue('');
    onClose();
  };

  const rangeDisplay =
    totalPages > 0 ? (labels.rangeText ?? t('pagesRange', { totalPages })) : t('pagesRangeSingle');

  const placeholder = t('placeholder', { max: totalPages });

  return (
    <Modal withBackdrop onClose={handleClose}>
      <div className={styles.goToPageForm}>
        <h2 className={styles.goToPageTitle} id={inputId + '-title'}>
          {title}
        </h2>
        <form onSubmit={handleSubmit} aria-labelledby={inputId + '-title'}>
          <Input
            id={inputId}
            type="number"
            min={1}
            max={totalPages}
            value={value}
            onChange={setValue}
            label={pageLabel}
            error={error}
            placeholder={placeholder}
            aria-describedby={inputId + '-range'}
          />
          <p id={inputId + '-range'} className={styles.goToPageRange}>
            {rangeDisplay}
          </p>
          <div className={styles.goToPageActions}>
            <Button type="submit" variant="primary">
              {submitLabel}
            </Button>
            <Button type="button" onClick={handleClose}>
              {closeLabel}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
