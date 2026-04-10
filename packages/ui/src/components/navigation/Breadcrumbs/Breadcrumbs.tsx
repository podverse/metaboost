import type { ReactNode } from 'react';

import styles from './Breadcrumbs.module.scss';

export type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

export type BreadcrumbsLinkComponentProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  LinkComponent: React.ComponentType<BreadcrumbsLinkComponentProps>;
  /** Accessible label for the nav element. */
  ariaLabel?: string;
};

/**
 * Renders a list of breadcrumb items. The last item is always rendered as current (text only, never a link).
 * All other items with href are rendered as links; items without href are rendered as current.
 */
export function Breadcrumbs({ items, LinkComponent, ariaLabel = 'Breadcrumb' }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={ariaLabel} className={styles.wrapper}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const linkHref = item.href ?? '';
          const hasHref = linkHref !== '' && !isLast;
          return (
            <li key={index} className={styles.item}>
              {hasHref ? (
                <LinkComponent href={linkHref} className={styles.link}>
                  {item.label}
                </LinkComponent>
              ) : (
                <span className={styles.current}>{item.label}</span>
              )}
              {!isLast && <span className={styles.separator} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
