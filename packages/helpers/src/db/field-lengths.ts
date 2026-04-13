/**
 * Shared max lengths for DB columns and validation.
 * Align with infra/database/migrations (e.g. varchar_email, varchar_password, varchar_short).
 * Use in ORM entities and app validation so values stay in sync.
 */
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_HASH_LENGTH = 60;
export const PASSWORD_MAX_LENGTH = 72;
export const SHORT_TEXT_MAX_LENGTH = 50;
/** Medium-length text used by API payload fields (for example feed/item titles and IDs). */
export const MEDIUM_TEXT_MAX_LENGTH = 255;
/** Common practical upper bound used for URL-like identifiers in payload validation. */
export const URL_MAX_LENGTH = 2048;
/** Max length for user_credentials.username. Unique, nullable; at least one of email or username required. */
export const USERNAME_MAX_LENGTH = 50;

/** Length of short_id column (user.short_id, bucket.short_id). */
export const SHORT_ID_LENGTH = 12;
/** Min length for API input that accepts shortId (10–12 chars) or UUID. */
export const SHORT_ID_INPUT_MIN_LENGTH = 10;
/** UUID string length (e.g. 8-4-4-4-12 hex with hyphens). */
export const UUID_LENGTH = 36;

/** Length of bucket_admin_invitation.token column. */
export const INVITATION_TOKEN_LENGTH = 64;
/** Max length of bucket_admin_invitation.status (e.g. pending, accepted, rejected). */
export const INVITATION_STATUS_MAX_LENGTH = 20;

/** SHA-256 hex digest length; used for verification_token.token_hash. */
export const TOKEN_HASH_HEX_LENGTH = 64;
/** Max length for verification_token.kind (e.g. email_verify, password_reset). */
export const VERIFICATION_TOKEN_KIND_MAX_LENGTH = 32;

/** Default max length for bucket message body (used when creating bucket_settings and for display fallback). */
export const DEFAULT_MESSAGE_BODY_MAX_LENGTH = 1000;
