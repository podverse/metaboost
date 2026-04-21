/**
 * Optional Bearer token for Authorization header. Pass to request() or auth helpers
 * when not using cookie auth (e.g. server-side or non-browser). Omit or null for
 * credentials: 'include' (cookie) auth.
 */
export type BearerToken = string | null;

/**
 * POST body shape for endpoints that consume a verification token sent as JSON (`token`).
 * (@metaboost/api accepts these tokens in the JSON body only; query strings are not accepted.)
 */
export interface WithOptionalToken {
  token?: string;
}
