/**
 * Lengths for verification_token columns. Values must match
 * infra/database/migrations (varchar_token_kind, varchar_token_hash)
 * and @metaboost/helpers (TOKEN_HASH_HEX_LENGTH, VERIFICATION_TOKEN_KIND_MAX_LENGTH).
 */
export const TOKEN_HASH_HEX_LENGTH = 64;
export const VERIFICATION_TOKEN_KIND_MAX_LENGTH = 32;
