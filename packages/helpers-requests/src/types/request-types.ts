/**
 * Optional Bearer token for Authorization header. Pass to request() or auth helpers
 * when not using cookie auth (e.g. server-side or non-browser). Omit or null for
 * credentials: 'include' (cookie) auth.
 */
export type BearerToken = string | null;

/**
 * Shape of request body or query when a single optional token is accepted
 * (e.g. verify-email, confirm-email-change). Use to type req.body/req.query when
 * reading token from either source.
 */
export interface WithOptionalToken {
  token?: string;
}
