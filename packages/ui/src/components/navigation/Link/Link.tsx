'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { useNavigationContext } from '../../../contexts/NavigationContext';

import styles from './Link.module.scss';

export type LinkProps = Omit<React.ComponentProps<typeof NextLink>, 'onClick'> & {
  onClick?: () => void;
};

function isInternalHref(href: React.ComponentProps<typeof NextLink>['href']): href is string {
  return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');
}

function normalizePath(p: string): string {
  return p === '/' ? p : p.replace(/\/$/, '') || '/';
}

/** Strip query and hash from href so we only show loading overlay when pathname changes. */
function pathnameFromHref(href: string): string {
  const withoutHash = href.split('#')[0] ?? '';
  const pathnameOnly = withoutHash.split('?')[0] ?? '';
  return pathnameOnly;
}

/**
 * Link component that wraps Next.js Link for client-side navigation.
 * When used inside NavigationProvider, shows a full-screen loading overlay on click for internal links
 * only when navigating in the current tab to a different pathname (not for target="_blank" or query-only changes).
 * Use as the default LinkComponent for FormLinks, NavBar, and other UI components.
 * Applies shared link styles (primary color, hover underline).
 */
export function Link({ href, children, className = '', onClick, target, ...rest }: LinkProps) {
  const pathname = usePathname();
  const navigationContext = useNavigationContext();
  const combinedClass = [styles.root, className].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const opensInNewTab =
      target === '_blank' ||
      (typeof target === 'string' && target !== '_self') ||
      e.ctrlKey ||
      e.metaKey ||
      e.button !== 0;
    if (!opensInNewTab && isInternalHref(href)) {
      const targetPath = normalizePath(pathnameFromHref(href));
      const currentPath = pathname !== null ? normalizePath(pathname) : '';
      if (targetPath !== currentPath) {
        navigationContext?.setNavigating(true);
      }
    }
    onClick?.();
  };

  return (
    <NextLink href={href} className={combinedClass} onClick={handleClick} target={target} {...rest}>
      {children}
    </NextLink>
  );
}
