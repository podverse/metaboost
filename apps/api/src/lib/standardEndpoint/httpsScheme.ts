import type { Request } from 'express';

import { parseEnvBooleanToken } from '@metaboost/helpers';

/**
 * When `STANDARD_ENDPOINT_REQUIRE_HTTPS` is unset or empty: enforce HTTPS only if `NODE_ENV === 'production'`.
 * When set: explicit `true`/`false`/`1`/`0`/`yes`/`no` (case-insensitive).
 */
export function resolveStandardEndpointRequireHttps(): boolean {
  const raw = process.env.STANDARD_ENDPOINT_REQUIRE_HTTPS?.trim();
  if (raw !== undefined && raw !== '') {
    const parsed = parseEnvBooleanToken(raw);
    if (parsed !== null) {
      return parsed;
    }
    return false;
  }
  return process.env.NODE_ENV === 'production';
}

/**
 * When `STANDARD_ENDPOINT_TRUST_PROXY` is unset or empty: do not trust `X-Forwarded-Proto`.
 * When set: `true`/`false`/`1`/`0`/`yes`/`no` (case-insensitive).
 */
export function resolveStandardEndpointTrustProxy(): boolean {
  const raw = process.env.STANDARD_ENDPOINT_TRUST_PROXY?.trim();
  if (raw === undefined || raw === '') {
    return false;
  }
  const parsed = parseEnvBooleanToken(raw);
  if (parsed !== null) {
    return parsed;
  }
  return false;
}

/**
 * Effective request scheme for policy checks. Honors `X-Forwarded-Proto` only when
 * {@link resolveStandardEndpointTrustProxy} is true (TLS-terminating reverse proxy).
 */
export function getEffectiveRequestScheme(req: Request): 'http' | 'https' {
  if (resolveStandardEndpointTrustProxy()) {
    const xfp = req.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
    if (xfp === 'https' || xfp === 'http') {
      return xfp;
    }
  }
  return req.protocol === 'https' ? 'https' : 'http';
}
