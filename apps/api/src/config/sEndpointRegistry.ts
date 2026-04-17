/**
 * Standard Endpoint app registry (public JSON records). Default: Podverse metaboost-registry on GitHub.
 * Lookup: `<base>/<app_id>.app.json`
 */

export const DEFAULT_S_ENDPOINT_REGISTRY_URL =
  'https://raw.githubusercontent.com/podverse/metaboost-registry/main/registry/apps';

const DEFAULT_POLL_SECONDS = 300;
const DEFAULT_TIMEOUT_MS = 10_000;

export function normalizeRegistryBaseUrl(raw: string): string {
  return raw.trim().replace(/\/$/, '');
}

export function buildAppRegistryRecordUrl(registryBaseUrl: string, appId: string): string {
  const base = normalizeRegistryBaseUrl(registryBaseUrl);
  return `${base}/${encodeURIComponent(appId)}.app.json`;
}

type EnvGetter = (key: string) => string | undefined;

export function resolveSEndpointRegistryFromEnv(getOptional: EnvGetter): {
  sEndpointRegistryUrl: string;
  sEndpointRegistryPollSeconds: number;
  sEndpointRegistryTimeoutMs: number;
} {
  const rawBase = getOptional('S_ENDPOINT_REGISTRY_URL');
  const sEndpointRegistryUrl = normalizeRegistryBaseUrl(
    rawBase === undefined || rawBase === '' ? DEFAULT_S_ENDPOINT_REGISTRY_URL : rawBase
  );

  const pollRaw = getOptional('S_ENDPOINT_REGISTRY_POLL_SECONDS');
  const sEndpointRegistryPollSeconds = Number.parseInt(
    pollRaw === undefined || pollRaw === '' ? String(DEFAULT_POLL_SECONDS) : pollRaw,
    10
  );

  const timeoutRaw = getOptional('S_ENDPOINT_REGISTRY_TIMEOUT_MS');
  const sEndpointRegistryTimeoutMs = Number.parseInt(
    timeoutRaw === undefined || timeoutRaw === '' ? String(DEFAULT_TIMEOUT_MS) : timeoutRaw,
    10
  );

  return {
    sEndpointRegistryUrl,
    sEndpointRegistryPollSeconds,
    sEndpointRegistryTimeoutMs,
  };
}
