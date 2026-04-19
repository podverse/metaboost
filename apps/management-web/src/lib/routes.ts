/**
 * App route paths. Use these constants for navigation and links instead of hardcoded strings.
 */
export const ROUTES = {
  HOME: '/dashboard',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ADMINS: '/admins',
  ADMINS_NEW: '/admins/new',
  ADMIN_ROLES_NEW: '/admins/roles/new',
  EVENTS: '/events',
  USERS: '/users',
  USERS_NEW: '/users/new',
  BUCKETS: '/buckets',
  BUCKETS_NEW: '/buckets/new',
} as const;

/** Account settings tab; URL param ?tab= for profile, password. No email tab (management has no mailer). */
export type AccountSettingsTab = 'general' | 'profile' | 'password';

export function accountSettingsRoute(tab?: AccountSettingsTab): string {
  const base = ROUTES.SETTINGS;
  if (tab === 'profile') return `${base}?tab=profile`;
  if (tab === 'password') return `${base}?tab=password`;
  return base;
}

export function adminViewRoute(id: string): string {
  return `/admin/${id}`;
}

export function adminEditRoute(id: string): string {
  return `/admin/${id}/edit`;
}

export function adminRolesNewRoute(returnUrl?: string): string {
  if (returnUrl !== undefined && returnUrl !== '') {
    return `${ROUTES.ADMIN_ROLES_NEW}?returnUrl=${encodeURIComponent(returnUrl)}`;
  }
  return ROUTES.ADMIN_ROLES_NEW;
}

export function userViewRoute(id: string): string {
  return `/user/${id}`;
}

/** Edit user page tab; URL param ?tab= for password. Default (no param) = profile. */
export type EditUserTab = 'profile' | 'password';

export function userEditRoute(id: string, tab?: EditUserTab): string {
  const base = `/user/${id}/edit`;
  if (tab === 'password') return `${base}?tab=password`;
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

export function bucketViewRoute(id: string): string {
  return bucketPathFromAncestry([id]);
}

/** Tab on bucket detail page: messages | buckets. Used for ?tab= query. */
export type BucketDetailTab = 'messages' | 'buckets';

/**
 * Bucket detail URL with optional tab, page, and sort query params.
 */
export function bucketDetailTabRoute(
  id: string,
  tab?: BucketDetailTab,
  page?: number,
  sort?: 'recent' | 'oldest'
): string {
  const base = bucketViewRoute(id);
  const params = new URLSearchParams();
  if (tab !== undefined) params.set('tab', tab);
  if (page !== undefined && page > 1) params.set('page', String(page));
  if (sort === 'oldest') params.set('sort', 'oldest');
  const q = params.toString();
  return q !== '' ? `${base}?${q}` : base;
}

export function bucketEditRoute(id: string): string {
  return bucketPathFromAncestry([id]) + '/edit';
}

export type BucketSettingsTab = 'general' | 'admins' | 'roles' | 'blocked';

export function bucketSettingsRoute(id: string, tab?: BucketSettingsTab): string {
  const base = bucketPathFromAncestry([id]) + '/settings';
  if (tab === 'admins') return `${base}?tab=admins`;
  if (tab === 'roles') return `${base}?tab=roles`;
  if (tab === 'blocked') return `${base}?tab=blocked`;
  return base;
}

export function bucketSettingsRouteFromAncestry(
  ancestry: string[],
  tab?: BucketSettingsTab
): string {
  const base = bucketPathFromAncestry(ancestry) + '/settings';
  if (tab === 'admins') return `${base}?tab=admins`;
  if (tab === 'roles') return `${base}?tab=roles`;
  if (tab === 'blocked') return `${base}?tab=blocked`;
  return base;
}

export function bucketSettingsAdminsRoute(id: string): string {
  return bucketSettingsRoute(id, 'admins');
}

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

export function bucketViewRouteFromAncestry(ancestry: string[]): string {
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
export const PUBLIC_PATHS: readonly string[] = ['/', ROUTES.LOGIN];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}
