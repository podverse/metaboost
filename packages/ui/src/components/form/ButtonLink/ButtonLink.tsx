'use client';

import type { LinkProps } from '../../navigation/Link';
import type { ButtonVariant } from '../Button/Button';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { useNavigationContext } from '../../../contexts/NavigationContext';

import styles from './ButtonLink.module.scss';

export type ButtonLinkProps = Omit<LinkProps, 'className'> & {
  variant?: ButtonVariant;
  className?: string;
};

function isInternalHref(href: ButtonLinkProps['href']): href is string {
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

export function ButtonLink({
  href,
  variant = 'secondary',
  className = '',
  children,
  onClick,
  target,
  ...rest
}: ButtonLinkProps) {
  const pathname = usePathname();
  const navigationContext = useNavigationContext();
  const variantClass =
    variant === 'primary'
      ? styles.primary
      : variant === 'link'
        ? styles.linkVariant
        : styles.secondary;
  const combinedClass = [styles.root, variantClass, className].filter(Boolean).join(' ');

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
