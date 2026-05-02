/**
 * Shared max lengths for DB columns and validation.
 * Align with canonical schema in infra/k8s/base/db/source/app/0001_app_schema.sql
 * (e.g. varchar_email, varchar_password, nano_id_v2 for user/bucket `id_text`).
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

export {
  NANO_ID_V2_MAX_LENGTH,
  NANO_ID_V2_MIN_LENGTH,
  generateRandomIdText,
  isValidNanoIdV2IdText,
} from '../nanoid.js';

/**
 * Management access JWT `id_text` (management user username): same bounds as `management_user_credentials.username`.
 */
export function isValidManagementJwtIdText(value: string): boolean {
  const len = value.length;
  return len >= 1 && len <= USERNAME_MAX_LENGTH;
}
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

/** Default max length for bucket message body (used when creating root bucket_settings and fallbacks). */
export const DEFAULT_MESSAGE_BODY_MAX_LENGTH = 500;
/** Minimum allowed per-bucket message body max length. */
export const MIN_MESSAGE_BODY_MAX_LENGTH = 140;
/** Maximum allowed per-bucket message body max length. */
export const MAX_MESSAGE_BODY_MAX_LENGTH = 2500;

/** Default server-side bucket preferred currency code. */
export const DEFAULT_BUCKET_PREFERRED_CURRENCY = 'USD';
/** Default optional public boost message list display floor (0 = no owner filter). */
export const DEFAULT_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR = 0;
/** Minimum allowed public boost display floor in root preferred-currency minor units. */
export const MIN_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR = 0;
/** Maximum allowed public boost display floor in root preferred-currency minor units. */
export const MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR = 2_147_483_647;
