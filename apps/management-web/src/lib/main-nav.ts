/**
 * Main navigation config and read-permission visibility for management-web tabs.
 * Tabs are shown only when the user has read access (or no permission is required).
 */

import type { ManagementUserPermissions } from '../types/management-api';

import { CRUD_BITS, bitmaskToFlags } from '@metaboost/helpers';

import { ROUTES } from './routes';

/** Permission keys that hold a CRUD bitmask. Used to gate tab visibility by read access. */
export type CrudPermissionKey = keyof Pick<
  ManagementUserPermissions,
  'adminsCrud' | 'usersCrud' | 'bucketsCrud' | 'bucketMessagesCrud' | 'bucketAdminsCrud'
>;

export type MainNavEntry = {
  href: string;
  /** Translation key for the tab label (e.g. 'common:dashboard'). */
  labelKey: string;
  /** When set, tab is visible only if user has read permission for this resource. */
  readPermission?: CrudPermissionKey;
  /** When true, tab is visible only for super admin users. */
  superAdminOnly?: boolean;
};

/** All main nav entries in display order. Add new tabs here with optional readPermission. */
export const MAIN_NAV_ENTRIES: MainNavEntry[] = [
  { href: ROUTES.DASHBOARD, labelKey: 'dashboard' },
  { href: ROUTES.ADMINS, labelKey: 'admins', readPermission: 'adminsCrud' },
  {
    href: ROUTES.GLOBAL_BLOCKED_APPS,
    labelKey: 'globalBlockedApps',
    readPermission: 'adminsCrud',
  },
  { href: ROUTES.EVENTS, labelKey: 'events' },
  { href: ROUTES.TERMS_VERSIONS, labelKey: 'termsVersions', superAdminOnly: true },
  { href: ROUTES.USERS, labelKey: 'users', readPermission: 'usersCrud' },
  { href: ROUTES.BUCKETS, labelKey: 'buckets', readPermission: 'bucketsCrud' },
];

/**
 * Returns true if the user has read access for the given CRUD permission key.
 * Super-admin is not checked here; the caller should treat super-admin as having all access.
 */
export function hasReadPermission(
  permissions: ManagementUserPermissions | null | undefined,
  key: CrudPermissionKey
): boolean {
  const mask = permissions?.[key] ?? 0;
  return (mask & CRUD_BITS.read) !== 0;
}

export type CrudFlags = {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

/**
 * Returns CRUD flags for the given permission key. Super-admin gets all true.
 * Callers should pass isSuperAdmin from the server user.
 */
export function getCrudFlags(
  isSuperAdmin: boolean,
  permissions: ManagementUserPermissions | null | undefined,
  key: CrudPermissionKey
): CrudFlags {
  if (isSuperAdmin) {
    return { create: true, read: true, update: true, delete: true };
  }
  return bitmaskToFlags(permissions?.[key] ?? 0);
}

export type VisibleNavItem = {
  href: string;
  label: string;
};

/**
 * Returns nav items that the user is allowed to see (read permission or no permission required).
 * Labels are translated using the provided t function (e.g. getTranslations('common')).
 */
export function getVisibleNavItems(
  isSuperAdmin: boolean,
  permissions: ManagementUserPermissions | null | undefined,
  t: (key: string) => string
): VisibleNavItem[] {
  return MAIN_NAV_ENTRIES.filter((entry) => {
    if (entry.superAdminOnly === true) return isSuperAdmin;
    if (entry.readPermission === undefined) return true;
    if (isSuperAdmin) return true;
    return hasReadPermission(permissions, entry.readPermission);
  }).map((entry) => ({
    href: entry.href,
    label: t(entry.labelKey),
  }));
}
