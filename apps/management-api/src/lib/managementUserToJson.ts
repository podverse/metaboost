import type { ManagementUser } from '@metaboost/management-orm';
import type { EventVisibility } from '@metaboost/management-orm';

/**
 * Safe shape for management user in API responses. Only these fields may be returned.
 * Never include credentials (e.g. passwordHash) or raw tokens. Handlers must never
 * serialize req.managementUser or user.credentials directly in responses; use this
 * function as the single place to serialize management users.
 */
export interface PublicManagementUser {
  id: string;
  username: string;
  displayName: string;
  isSuperAdmin: boolean;
  createdAt: string;
  createdBy: string | null;
  permissions?: {
    adminsCrud: number;
    usersCrud: number;
    bucketsCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
    eventVisibility: EventVisibility;
  } | null;
}

export function managementUserToJson(user: ManagementUser): PublicManagementUser {
  const perm = user.permissions;
  return {
    id: user.id,
    username: user.credentials.username,
    displayName: user.bio?.displayName ?? '',
    isSuperAdmin: user.isSuperAdmin,
    createdAt: user.createdAt.toISOString(),
    createdBy: user.createdBy,
    permissions:
      perm !== undefined && perm !== null
        ? {
            adminsCrud: perm.adminsCrud,
            usersCrud: perm.usersCrud,
            bucketsCrud: perm.bucketsCrud,
            bucketMessagesCrud: perm.bucketMessagesCrud,
            bucketAdminsCrud: perm.bucketAdminsCrud,
            eventVisibility: perm.eventVisibility,
          }
        : null,
  };
}
