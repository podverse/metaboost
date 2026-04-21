import type { WebRuntimeConfig } from './runtime-config';

import { request } from '@metaboost/helpers-requests';

const getRuntimeConfigUrl = (): string => {
  const url = process.env.RUNTIME_CONFIG_URL;
  if (url === undefined || url === null || url === '') {
    throw new Error('Missing RUNTIME_CONFIG_URL for runtime config sidecar.');
  }
  const normalized = url.replace(/\/$/, '');
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`Invalid RUNTIME_CONFIG_URL: "${url}"`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Invalid RUNTIME_CONFIG_URL protocol: "${url}"`);
  }
  return normalized;
};

let cachedRuntimeConfig: Promise<WebRuntimeConfig> | null = null;

const fetchUncached = async (): Promise<WebRuntimeConfig> => {
  const baseUrl = getRuntimeConfigUrl();
  const res = await request(baseUrl, '/runtime-config', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(
      `Runtime config sidecar returned ${res.status}. ${res.error?.message ?? ''}`.trim()
    );
  }
  const runtimeConfig = res.data as WebRuntimeConfig;
  return runtimeConfig;
};

export const fetchWebRuntimeConfigFromSidecar = async (): Promise<WebRuntimeConfig> => {
  if (cachedRuntimeConfig !== null) {
    return cachedRuntimeConfig;
  }
  cachedRuntimeConfig = fetchUncached();
  return cachedRuntimeConfig;
};
