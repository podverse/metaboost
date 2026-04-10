/** Event visibility for admin permissions. Matches @boilerplate/management-orm EventVisibility. */
export type EventVisibility = 'own' | 'all_admins' | 'all';

/**
 * Safe shape for an admin in API list/get responses. Matches management-api managementUserToJson.
 * Never includes credentials; use for typing GET /admins and GET /admins/:id data.
 * Management auth is username-only (no email).
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

/** Response data for GET /admins (paginated list). */
export interface ListAdminsData {
  admins: PublicManagementUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  truncatedTotal?: true;
}

/** Validated body for POST /admins. All required fields guaranteed by createAdminSchema. */
export interface CreateAdminBody {
  username: string;
  password: string;
  displayName: string;
  roleId?: string;
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: EventVisibility;
}

/** Validated body for PATCH /admins/:id. At least one field present; validated by updateAdminSchema. */
export interface UpdateAdminBody {
  username?: string;
  displayName?: string;
  password?: string;
  roleId?: string;
  adminsCrud?: number;
  usersCrud?: number;
  bucketsCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
  eventVisibility?: EventVisibility;
}
