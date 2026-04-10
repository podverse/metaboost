'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import styles from './Tabs.module.scss';

export type TabItem = {
  href: string;
  label: string;
};

export type TabsLinkComponentProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export type TabsProps = {
  /** Tab items (href + label). Uses Next.js client navigation when LinkComponent is Next Link. */
  items: TabItem[];
  /** Link component for client-side navigation (e.g. Next.js Link from @boilerplate/ui). */
  LinkComponent: React.ComponentType<TabsLinkComponentProps>;
  /**
   * Current location used for active state. Must equal the href of the tab item for the current tab.
   * When using exactMatch with URLs that have query params (e.g. ?tab=messages&sort=oldest), pass
   * the canonical tab href (same as the tab item's href), not the full URL, or no tab will match.
   * If omitted, uses usePathname() (pathname only, no search).
   */
  activeHref?: string;
  /** When true, only exact path match is active (no prefix match). Use for sibling tabs under the same base path. */
  exactMatch?: boolean;
};

/**
 * Horizontal tabs navigation. Renders a list of links with active state based on current path.
 * Pass LinkComponent for framework routing (e.g. Next.js Link) so clicks do not trigger full reload.
 */
export function Tabs({ items, LinkComponent, activeHref, exactMatch = false }: TabsProps) {
  const t = useTranslations('ui.tabs');
  const pathname = usePathname();
  const currentHref = activeHref ?? pathname ?? '';

  return (
    <nav aria-label={t('navAriaLabel')}>
      <div className={styles.scrollWrap}>
        <ul className={styles.nav}>
          {items.map((item) => {
            const isActive = exactMatch
              ? currentHref === item.href
              : currentHref === item.href ||
                (item.href !== '/' && currentHref.startsWith(item.href + '/'));
            const linkClass = [styles.tabLink, isActive ? styles.tabLinkActive : '']
              .filter(Boolean)
              .join(' ');
            return (
              <li key={item.href} className={styles.tab}>
                <LinkComponent href={item.href} className={linkClass}>
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
