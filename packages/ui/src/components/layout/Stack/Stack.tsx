import type { HTMLAttributes } from 'react';

import styles from './Stack.module.scss';

export type StackProps = HTMLAttributes<HTMLDivElement> & {
  /** When set, constrains width: "readable" (e.g. messages list), "form" (form width, aligns with FormContainer). */
  maxWidth?: 'readable' | 'form';
  /** When true and maxWidth is set, centers the constrained content horizontally. */
  centerContent?: boolean;
  /** When "center", aligns children horizontally (cross-axis). Use for centered buttons, etc. */
  alignItems?: 'center';
};

export function Stack({
  className = '',
  maxWidth,
  centerContent = false,
  alignItems,
  ...props
}: StackProps) {
  const widthClass =
    maxWidth === 'readable' ? styles.stackReadable : maxWidth === 'form' ? styles.stackForm : '';
  const centerClass = centerContent && widthClass !== '' ? ` ${styles.stackCenterContent}` : '';
  const alignClass = alignItems === 'center' ? ` ${styles.stackAlignCenter}` : '';
  const stackClass =
    widthClass !== ''
      ? `${styles.stack} ${widthClass}${centerClass}${alignClass}${className ? ` ${className}` : ''}`
      : `${styles.stack}${alignClass}${className ? ` ${className}` : ''}`.trim();
  return <div className={stackClass} {...props} />;
}
