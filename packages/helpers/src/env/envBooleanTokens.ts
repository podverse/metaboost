/**
 * Case-insensitive env-style booleans used by MetaBoost startup and standard-endpoint HTTPS flags.
 *
 * Differs from {@link isTruthyQueryFlag} (HTTP query): query flags use only literal `true`/`1`; env tokens
 * accept `yes`/`no`/`0`/`false` as well.
 */

/** Normalize env string for six-token boolean parsing (`trim` + lowercase). */
export function normalizeEnvBooleanTokenInput(raw: string): string {
  return raw.trim().toLowerCase();
}

/** @param normalized Result of {@link normalizeEnvBooleanTokenInput}. */
export function isEnvBooleanTruthyToken(normalized: string): boolean {
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/** @param normalized Result of {@link normalizeEnvBooleanTokenInput}. */
export function isEnvBooleanFalsyToken(normalized: string): boolean {
  return normalized === 'false' || normalized === '0' || normalized === 'no';
}

/**
 * Parses six allowed tokens after normalization. Returns `null` when the value is not a recognized flag.
 */
export function parseEnvBooleanToken(raw: string): boolean | null {
  const t = normalizeEnvBooleanTokenInput(raw);
  if (isEnvBooleanTruthyToken(t)) {
    return true;
  }
  if (isEnvBooleanFalsyToken(t)) {
    return false;
  }
  return null;
}

/** Whether `raw` is exactly one of the six env-style boolean spellings (after trim + lowercase). */
export function isValidEnvBooleanToken(raw: string): boolean {
  return parseEnvBooleanToken(raw) !== null;
}

/**
 * Management-api only: gate startup `PING` wait and versioned `/health/ready` on Valkey when KeyVal is
 * clearly in play — explicit `KEYVALDB_HOST` / `KEYVALDB_PORT`, or auth rate limiting uses Valkey.
 * Main Metaboost API always integrates Valkey (replay store); it does not use this helper.
 */
export function shouldGateMetaboostManagementApiValkeyStartupReadiness(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const host = env.KEYVALDB_HOST?.trim() ?? '';
  const port = env.KEYVALDB_PORT?.trim() ?? '';
  if (host !== '' || port !== '') {
    return true;
  }
  const raw = env.MANAGEMENT_API_AUTH_RATE_LIMIT_USE_KEYVALDB?.trim() ?? '';
  if (raw === '') {
    return false;
  }
  return parseEnvBooleanToken(raw) === true;
}
