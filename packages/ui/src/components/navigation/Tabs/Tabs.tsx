'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import styles from './Tabs.module.scss';

export type TabItem = {
  href: string;
  label: string;
  /** Stable React key when multiple tabs share the same href (required if href duplicates). */
  itemKey?: string;
  /** Passed to Link (e.g. preventDefault + cookie + refresh). */
  linkOnClick?: React.MouseEventHandler<HTMLElement>;
};

export type TabsLinkComponentProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

export type TabsProps = {
  /** Tab items (href + label). Uses Next.js client navigation when LinkComponent is Next Link. */
  items: TabItem[];
  /** Link component for client-side navigation (e.g. Next.js Link from @metaboost/ui). */
  LinkComponent: React.ComponentType<TabsLinkComponentProps>;
  /**
   * Current location used for active state. Must equal the href of the tab item for the current tab.
   * When using exactMatch with URLs that have query params (e.g. ?tab=messages&sort=oldest), pass
   * the canonical tab href (same as the tab item's href), not the full URL, or no tab will match.
   * If omitted, uses usePathname() (pathname only, no search).
   */
  activeHref?: string;
  /**
   * When items use duplicate hrefs with itemKey, selects which tab is active (exactMatch only).
   */
  activeItemKey?: string;
  /** When true, only exact path match is active (no prefix match). Use for sibling tabs under the same base path. */
  exactMatch?: boolean;
};

/**
 * Horizontal tabs navigation. Renders a list of links with active state based on current path.
 * Pass LinkComponent for framework routing (e.g. Next.js Link) so clicks do not trigger full reload.
 */
export function Tabs({
  items,
  LinkComponent,
  activeHref,
  activeItemKey,
  exactMatch = false,
}: TabsProps) {
  const t = useTranslations('ui.tabs');
  const pathname = usePathname();
  const currentHref = activeHref ?? pathname ?? '';

  return (
    <nav aria-label={t('navAriaLabel')}>
      <div className={styles.wrap}>
        <ul className={styles.nav}>
          {items.map((item) => {
            const key = item.itemKey ?? item.href;
            const isActive = exactMatch
              ? activeItemKey !== undefined && item.itemKey !== undefined
                ? activeItemKey === item.itemKey
                : currentHref === item.href
              : currentHref === item.href ||
                (item.href !== '/' && currentHref.startsWith(item.href + '/'));
            const linkClass = [styles.tabLink, isActive ? styles.tabLinkActive : '']
              .filter(Boolean)
              .join(' ');
            return (
              <li key={key} className={styles.tab}>
                <LinkComponent href={item.href} className={linkClass} onClick={item.linkOnClick}>
                  {item.label}
                </LinkComponent>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
