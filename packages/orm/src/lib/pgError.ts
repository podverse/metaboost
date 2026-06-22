/**
 * Postgres / node-pg errors expose `code` as a string (e.g. `23505` unique violation).
 * Single narrowing assertion for driver error shape; prefer `isPgUniqueViolation` at call sites.
 */
export function getPgErrorCode(err: unknown): string | undefined {
  if (err === null || typeof err !== 'object' || !('code' in err)) {
    return undefined;
  }
  const code = (err as { code: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

export function isPgUniqueViolation(err: unknown): boolean {
  return getPgErrorCode(err) === '23505';
}
