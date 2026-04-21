/**
 * Hostname allowlisting for outbound HTTPS URLs (registry, exchange-rate providers).
 */

/** Default registry base URL (same as {@link DEFAULT_STANDARD_ENDPOINT_REGISTRY_URL} in the API config module). */
export const DEFAULT_METABOOST_REGISTRY_BASE_URL =
  'https://raw.githubusercontent.com/v4v-io/metaboost-registry/main/registry/apps';

/** Default hosts for {@link STANDARD_ENDPOINT_REGISTRY_URL} outbound fetches (GitHub raw + GitHub API listing). */
export const STANDARD_ENDPOINT_REGISTRY_DEFAULT_HOSTS = [
  'raw.githubusercontent.com',
  'api.github.com',
] as const;

/** Default hosts for Frankfurter + CoinGecko exchange-rate integrations. */
export const API_EXCHANGE_RATES_PROVIDER_DEFAULT_HOSTS = [
  'api.frankfurter.app',
  'api.coingecko.com',
] as const;

/** Parse comma-separated hostname list from env (trim, lowercase ASCII hostnames). */
export function parseCommaSeparatedHostExtras(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === '') {
    return [];
  }
  const out: string[] = [];
  for (const part of raw.split(',')) {
    const t = part.trim().toLowerCase();
    if (t !== '') {
      out.push(t);
    }
  }
  return out;
}

export function buildHostnameAllowSet(
  defaults: readonly string[],
  extras: readonly string[]
): Set<string> {
  const s = new Set<string>();
  for (const h of defaults) {
    s.add(h.toLowerCase());
  }
  for (const h of extras) {
    s.add(h.toLowerCase());
  }
  return s;
}

/** Returns normalized hostname or null if URL is invalid / not http(s). */
export function hostnameFromHttpUrl(urlString: string): string | null {
  try {
    const u = new URL(urlString);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return null;
    }
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function hostnameAllowed(hostname: string, allowed: ReadonlySet<string>): boolean {
  return allowed.has(hostname.toLowerCase());
}
