import type { ManagementUserPermissions } from '../types/management-api';

/**
 * Authenticated admin user propagated via `x-auth-user` after `/auth/me` or `/auth/refresh`.
 * Shared by the Edge proxy session restore path and SSR `getServerUser()`.
 */
export type ManagementSessionUser = {
  id: string;
  username: string;
  displayName: string | null;
  isSuperAdmin: boolean;
  permissions?: ManagementUserPermissions | null;
};

/** Parse GET /auth/me JSON response into {@link ManagementSessionUser}. */
export function parseManagementMeEnvelope(data: unknown): ManagementSessionUser | null {
  if (data === undefined || typeof data !== 'object' || data === null) {
    return null;
  }
  if (
    !('user' in data) ||
    typeof (data as { user: unknown }).user !== 'object' ||
    (data as { user: unknown }).user === null
  ) {
    return null;
  }
  const u = (
    data as {
      user: {
        id?: string;
        username?: string;
        displayName?: string | null;
        isSuperAdmin?: boolean;
        permissions?: ManagementUserPermissions | null;
      };
    }
  ).user;
  if (typeof u.id !== 'string' || typeof u.username !== 'string') {
    return null;
  }
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName ?? null,
    isSuperAdmin: u.isSuperAdmin === true,
    permissions: u.permissions ?? null,
  };
}
