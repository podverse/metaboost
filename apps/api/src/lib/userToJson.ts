import type { UserWithRelations } from '@metaboost/orm';

/**
 * Safe shape for user in API responses. Only these fields may be returned.
 * Never include credentials (e.g. passwordHash).
 * Email and username are optional (at least one is set in DB; legacy or username-only users).
 */
export interface PublicUser {
  id: string;
  shortId: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
}

/**
 * Non-PII shape for returning *another* user (e.g. bucket admins list). Use this when the
 * response describes a user other than the authenticated user. Email must not be returned
 * for other users. Username and displayName are safe to return for identity in lists/details.
 */
export interface PublicUserSummary {
  id: string;
  shortId: string;
  username: string | null;
  displayName: string | null;
}

/**
 * Serialize user for self endpoints (login, me, signup, refresh, etc.). Returns safe
 * fields including email/username (PII allowed only for the authenticated user).
 */
export function userToJson(user: UserWithRelations): PublicUser {
  return {
    id: user.id,
    shortId: user.shortId,
    email: user.credentials.email ?? null,
    username: user.credentials.username ?? null,
    displayName: user.bio?.displayName ?? null,
  };
}

/**
 * Serialize user for responses that describe *another* user. Omits email so PII is never
 * returned for other users while keeping username/displayName available for UI identity.
 */
export function userToPublicSummary(user: UserWithRelations): PublicUserSummary {
  return {
    id: user.id,
    shortId: user.shortId,
    username: user.credentials.username ?? null,
    displayName: user.bio?.displayName ?? null,
  };
}
