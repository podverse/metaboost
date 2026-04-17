/** Max AppAssertion lifetime in seconds (matches metaboost-signing-helpers). */
export const APP_ASSERTION_MAX_TTL_SECONDS = 300;

/** Clock skew for JWT verification and replay TTL tail (see docs/api/S-ENDPOINT-APP-SIGNING.md). */
export const APP_ASSERTION_CLOCK_TOLERANCE_SECONDS = 60;

export const APP_ASSERTION_AUTH_SCHEME = 'AppAssertion';
