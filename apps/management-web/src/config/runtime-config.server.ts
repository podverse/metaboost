import type { ManagementWebRuntimeConfig } from './runtime-config';

import { request } from '@boilerplate/helpers-requests';

const getRuntimeConfigUrl = (): string => {
  const url = process.env.RUNTIME_CONFIG_URL;
  if (url === undefined || url === null || url === '') {
    throw new Error('Missing RUNTIME_CONFIG_URL for runtime config sidecar.');
  }
  return url.replace(/\/$/, '');
};

let cachedRuntimeConfig: Promise<ManagementWebRuntimeConfig> | null = null;

const fetchUncached = async (): Promise<ManagementWebRuntimeConfig> => {
  const baseUrl = getRuntimeConfigUrl();
  const res = await request(baseUrl, '/runtime-config', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(
      `Runtime config sidecar returned ${res.status}. ${res.error?.message ?? ''}`.trim()
    );
  }
  const runtimeConfig = res.data as ManagementWebRuntimeConfig;
  return runtimeConfig;
};

export const fetchManagementWebRuntimeConfigFromSidecar =
  async (): Promise<ManagementWebRuntimeConfig> => {
    if (cachedRuntimeConfig !== null) {
      return cachedRuntimeConfig;
    }
    cachedRuntimeConfig = fetchUncached();
    return cachedRuntimeConfig;
  };
