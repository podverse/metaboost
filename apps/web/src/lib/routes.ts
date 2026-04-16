/**
 * App route paths. Use these constants for navigation and links instead of hardcoded strings.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  BUCKETS: '/buckets',
  BUCKETS_NEW: '/buckets/new',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  SET_PASSWORD: '/auth/set-password',
  VERIFY_EMAIL: '/auth/verify-email',
  CONFIRM_EMAIL_CHANGE: '/auth/confirm-email-change',
  TERMS: '/terms',
  HOW_TO_CREATORS: '/how-to/creators',
  HOW_TO_DEVELOPERS: '/how-to/developers',
} as const;

/**
 * Login route with optional safe return URL.
 * Only same-origin relative paths are allowed as return targets.
 */
export function loginRoute(returnUrl?: string): string {
  if (returnUrl === undefined || returnUrl.trim() === '') {
    return ROUTES.LOGIN;
  }
  const trimmed = returnUrl.trim();
  const isRelative = trimmed.startsWith('/') && !trimmed.startsWith('//');
  if (!isRelative) {
    return ROUTES.LOGIN;
  }
  return `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(trimmed)}`;
}

/** Account settings tab; URL param ?tab= for profile, password, email. */
export type AccountSettingsTab = 'general' | 'profile' | 'password' | 'email';

export function accountSettingsRoute(tab?: AccountSettingsTab): string {
  const base = ROUTES.SETTINGS;
  if (tab === 'profile') return `${base}?tab=profile`;
  if (tab === 'password') return `${base}?tab=password`;
  if (tab === 'email') return `${base}?tab=email`;
  return base;
}

/** Build private bucket path from root-to-leaf ancestry. e.g. [a,b,c] -> /bucket/a/bucket/b/bucket/c */
export function bucketPathFromAncestry(ancestry: string[]): string {
  if (ancestry.length === 0) return '/bucket';
  return ancestry.map((id) => `/bucket/${id}`).join('');
}

/**
 * Parse private bucket pathname into root-to-leaf ancestry, or null if not a bucket path.
 * e.g. /bucket/a/bucket/b/bucket/c -> [a,b,c]; /bucket/a/settings -> [a].
 */
export function parseBucketPath(pathname: string): string[] | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'bucket' || parts.length < 2) return null;
  const ancestry: string[] = [];
  let i = 0;
  while (i < parts.length) {
    const seg = parts[i + 1];
    if (parts[i] === 'bucket' && typeof seg === 'string') {
      ancestry.push(seg);
      i += 2;
    } else {
      break;
    }
  }
  return ancestry.length > 0 ? ancestry : null;
}

export function bucketDetailRoute(id: string): string {
  return bucketPathFromAncestry([id]);
}

/** Tab on bucket detail page: messages | buckets | add-to-rss. Used for ?tab= query. */
export type BucketDetailTab = 'messages' | 'buckets' | 'add-to-rss';

/**
 * Bucket detail URL with optional tab, page, and sort query params.
 * Use for Messages tab (default), Buckets tab (?tab=buckets), and pagination (?tab=messages&page=2&sort=oldest).
 */
export function bucketDetailTabRoute(
  id: string,
  tab?: BucketDetailTab,
  page?: number,
  sort?: 'recent' | 'oldest'
): string {
  const base = bucketDetailRoute(id);
  const params = new URLSearchParams();
  if (tab !== undefined && tab !== 'messages') params.set('tab', tab);
  if (page !== undefined && page > 1) params.set('page', String(page));
  if (sort === 'oldest') params.set('sort', 'oldest');
  const q = params.toString();
  return q !== '' ? `${base}?${q}` : base;
}

/**
 * Buckets tab on an RSS Network detail page, with a flag so the server does not redirect to Add RSS channel.
 * Used as Cancel href from /bucket/:id/new when the network has no rss-channel child yet.
 */
export function bucketDetailRssNetworkAfterAddCancelRoute(id: string): string {
  const base = bucketDetailTabRoute(id, 'buckets');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}skipEmptyRssNetworkRedirect=1`;
}

export function bucketEditRoute(id: string): string {
  return bucketPathFromAncestry([id]) + '/edit';
}

export type BucketSettingsTab = 'general' | 'admins' | 'roles';

export function bucketSettingsRoute(id: string, tab?: BucketSettingsTab): string {
  const base = bucketPathFromAncestry([id]) + '/settings';
  if (tab === 'admins') return `${base}?tab=admins`;
  if (tab === 'roles') return `${base}?tab=roles`;
  return base;
}

/** Ancestry-based settings base path. */
export function bucketSettingsRouteFromAncestry(
  ancestry: string[],
  tab?: BucketSettingsTab
): string {
  const base = bucketPathFromAncestry(ancestry) + '/settings';
  if (tab === 'admins') return `${base}?tab=admins`;
  if (tab === 'roles') return `${base}?tab=roles`;
  return base;
}

/** Settings page with Admins tab selected. Use for "back to admins" from edit page. */
export function bucketSettingsAdminsRoute(id: string): string {
  return bucketSettingsRoute(id, 'admins');
}

/** Settings page with Roles tab selected. */
export function bucketSettingsRolesRoute(id: string): string {
  return bucketSettingsRoute(id, 'roles');
}

export function bucketSettingsRoleNewRoute(bucketId: string, returnUrl?: string): string {
  const base = bucketPathFromAncestry([bucketId]) + '/settings/roles/new';
  if (returnUrl !== undefined && returnUrl !== '')
    return `${base}?returnUrl=${encodeURIComponent(returnUrl)}`;
  return base;
}

export function bucketSettingsRoleEditRoute(
  bucketId: string,
  roleId: string,
  returnUrl?: string
): string {
  const base = bucketPathFromAncestry([bucketId]) + '/settings/roles/' + roleId + '/edit';
  if (returnUrl !== undefined && returnUrl !== '')
    return `${base}?returnUrl=${encodeURIComponent(returnUrl)}`;
  return base;
}

export function bucketSettingsAdminEditRoute(bucketId: string, userId: string): string {
  return bucketPathFromAncestry([bucketId]) + '/settings/admins/' + userId + '/edit';
}

export function bucketMessagesRoute(id: string): string {
  return bucketPathFromAncestry([id]) + '/messages';
}

/** Detail, messages, and message-edit routes from ancestry (any depth). */
export function bucketDetailRouteFromAncestry(ancestry: string[]): string {
  return bucketPathFromAncestry(ancestry);
}

export function bucketMessagesRouteFromAncestry(ancestry: string[]): string {
  return bucketPathFromAncestry(ancestry) + '/messages';
}

export function bucketEditRouteFromAncestry(ancestry: string[]): string {
  return bucketPathFromAncestry(ancestry) + '/edit';
}

/** New sub-bucket (child) under the given ancestry. */
export function bucketNewRouteFromAncestry(ancestry: string[]): string {
  return bucketPathFromAncestry(ancestry) + '/new';
}

/** Paths where unauthenticated users are allowed; 401 on these should not trigger redirect. */
export const PUBLIC_PATHS: readonly string[] = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.SET_PASSWORD,
  ROUTES.VERIFY_EMAIL,
  ROUTES.CONFIRM_EMAIL_CHANGE,
  ROUTES.TERMS,
  ROUTES.HOW_TO_CREATORS,
  ROUTES.HOW_TO_DEVELOPERS,
];

/** Legacy /b/* paths remain public so they can return hard 404 without auth redirect. */
/** Admin invitation accept/decline page (login required to act, but page is public). */
export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/b/') || pathname.startsWith('/invite/')
  );
}

export function inviteRoute(token: string): string {
  return `/invite/${token}`;
}
