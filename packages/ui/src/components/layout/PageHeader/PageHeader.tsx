import type { ReactNode } from 'react';

import styles from './PageHeader.module.scss';

export type PageHeaderProps = {
  /** Page title (e.g. "Settings"). */
  title: ReactNode;
  className?: string;
};

export function PageHeader({ title, className = '' }: PageHeaderProps) {
  return (
    <header className={className}>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
