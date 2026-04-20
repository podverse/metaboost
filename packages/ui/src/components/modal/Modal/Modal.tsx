'use client';

import { useTranslations } from 'next-intl';

import styles from './Modal.module.scss';

export type ModalProps = {
  children: React.ReactNode;
  /** When true, overlay has a dark backdrop; when false, fully transparent. Default false. */
  withBackdrop?: boolean;
  /** When true (and withBackdrop), backdrop is opaque for better readability. Default false. */
  backdropOpaque?: boolean;
  /** When true, overlay and content do not capture pointer events; clicks pass through to the page. Use for non-blocking indicators (e.g. navigation loading spinner). Default false. */
  clickThrough?: boolean;
  /** When true, content area has transparent background (e.g. for centered spinner only). Default false. */
  contentTransparent?: boolean;
  /** Optional className for the overlay. */
  className?: string;
  /** When provided, a close button is shown in the upper-right corner of the modal content. */
  onClose?: () => void;
};

/**
 * Full-window overlay that centers its children. Use for loading overlays, dialogs, or
 * other modal content. Transparent by default; set withBackdrop for a dimmed backdrop.
 * When onClose is provided, a close button appears in the upper-right corner of the content.
 */
export function Modal({
  children,
  withBackdrop = false,
  backdropOpaque = false,
  clickThrough = false,
  contentTransparent = false,
  className = '',
  onClose,
}: ModalProps) {
  const t = useTranslations('ui.modal');
  const overlayClass = [
    styles.overlay,
    withBackdrop
      ? backdropOpaque
        ? styles.overlayBackdropOpaque
        : styles.overlayBackdrop
      : styles.overlayTransparent,
    clickThrough ? styles.overlayClickThrough : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const contentInnerClass = contentTransparent
    ? `${styles.contentInner} ${styles.contentInnerTransparent}`
    : styles.contentInner;

  const handleOverlayClick = (): void => {
    if (onClose !== undefined) {
      onClose();
    }
  };

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  return (
    <div
      className={overlayClass}
      role="presentation"
      onClick={onClose !== undefined ? handleOverlayClick : undefined}
    >
      <div className={styles.content}>
        <div className={contentInnerClass} onClick={handleContentClick}>
          {onClose !== undefined && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label={t('ariaClose')}
            >
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
