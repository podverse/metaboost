import type { HTMLAttributes } from 'react';

import styles from './Card.module.scss';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  /** When "surface", uses a tinted background (e.g. for message cards in a list). */
  variant?: 'default' | 'surface';
};

export function Card({
  title,
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  const rootClass =
    variant === 'surface'
      ? `${styles.root} ${styles.rootSurface}${className ? ` ${className}` : ''}`
      : className
        ? `${styles.root} ${className}`
        : styles.root;
  return (
    <div className={(rootClass ?? '').trim()} {...props}>
      {title !== undefined && <h2 className={styles.title}>{title}</h2>}
      {children}
    </div>
  );
}
