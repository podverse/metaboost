'use client';

import styles from './ModalDialogContent.module.scss';

export type ModalDialogContentProps = {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  actionsClassName?: string;
  minWidth?: 'dialog' | 'form';
};

/**
 * Standardized modal dialog body wrapper with safe padding so the Modal close
 * button never overlaps content. Use this for confirm/prompt style dialogs.
 */
export function ModalDialogContent({
  children,
  actions,
  className = '',
  bodyClassName = '',
  actionsClassName = '',
  minWidth = 'dialog',
}: ModalDialogContentProps) {
  const minWidthClass = minWidth === 'form' ? styles.minWidthForm : styles.minWidthDialog;
  const rootClassName = [styles.root, minWidthClass, className].filter(Boolean).join(' ');
  const bodyClassNames = [styles.body, bodyClassName].filter(Boolean).join(' ');
  const actionsClassNames = [styles.actions, actionsClassName].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      <div className={bodyClassNames}>{children}</div>
      {actions !== undefined ? <div className={actionsClassNames}>{actions}</div> : null}
    </div>
  );
}
