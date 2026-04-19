import { normalizeBaseUrl } from '@metaboost/helpers';

/**
 * Standard Endpoint app registry (public JSON records). Default: Podverse metaboost-registry on GitHub.
 * Lookup: `<base>/<app_id>.app.json`
 */

export const DEFAULT_STANDARD_ENDPOINT_REGISTRY_URL =
  'https://raw.githubusercontent.com/podverse/metaboost-registry/main/registry/apps';

const DEFAULT_POLL_SECONDS = 300;
const DEFAULT_TIMEOUT_MS = 10_000;

export const normalizeRegistryBaseUrl = (raw: string): string => normalizeBaseUrl(raw);

export function buildAppRegistryRecordUrl(registryBaseUrl: string, appId: string): string {
  const base = normalizeRegistryBaseUrl(registryBaseUrl);
  return `${base}/${encodeURIComponent(appId)}.app.json`;
}

type EnvGetter = (key: string) => string | undefined;

export function resolveStandardEndpointRegistryFromEnv(getOptional: EnvGetter): {
  standardEndpointRegistryUrl: string;
  standardEndpointRegistryPollSeconds: number;
  standardEndpointRegistryTimeoutMs: number;
} {
  const rawBase = getOptional('STANDARD_ENDPOINT_REGISTRY_URL');
  const standardEndpointRegistryUrl = normalizeRegistryBaseUrl(
    rawBase === undefined || rawBase === '' ? DEFAULT_STANDARD_ENDPOINT_REGISTRY_URL : rawBase
  );

  const pollRaw = getOptional('STANDARD_ENDPOINT_REGISTRY_POLL_SECONDS');
  const standardEndpointRegistryPollSeconds = Number.parseInt(
    pollRaw === undefined || pollRaw === '' ? String(DEFAULT_POLL_SECONDS) : pollRaw,
    10
  );

  const timeoutRaw = getOptional('STANDARD_ENDPOINT_REGISTRY_TIMEOUT_MS');
  const standardEndpointRegistryTimeoutMs = Number.parseInt(
    timeoutRaw === undefined || timeoutRaw === '' ? String(DEFAULT_TIMEOUT_MS) : timeoutRaw,
    10
  );

  return {
    standardEndpointRegistryUrl,
    standardEndpointRegistryPollSeconds,
    standardEndpointRegistryTimeoutMs,
  };
}
