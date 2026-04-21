export function isInternalHref(href: unknown): href is string {
  return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');
}

export function normalizePath(pathname: string): string {
  return pathname === '/' ? pathname : pathname.replace(/\/$/, '') || '/';
}

/** Strip query and hash from href so loading state only tracks pathname changes. */
export function pathnameFromHref(href: string): string {
  const withoutHash = href.split('#')[0] ?? '';
  return withoutHash.split('?')[0] ?? '';
}
