/** Main-app user as returned by GET /users and GET /users/:id (safe, no credentials). */
export interface PublicMainAppUser {
  id: string;
  idText: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
}

/** Response shape for GET /users. */
export interface ListUsersData {
  users: PublicMainAppUser[];
}

/**
 * Validated body for POST /users. At least one of email or username required.
 * If password provided, user is created with that password; otherwise set-password link is returned.
 * Guaranteed by createUserSchema.
 */
export interface CreateUserBody {
  email?: string;
  username?: string;
  password?: string;
  displayName?: string | null;
  initialBucketAdminIds?: string[];
}

/** Validated body for PATCH /users/:id. At least one field present. */
export interface UpdateUserBody {
  email?: string;
  displayName?: string | null;
}

/** Validated body for POST /users/:id/change-password. */
export interface ChangeUserPasswordBody {
  newPassword: string;
}
