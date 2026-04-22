import type { ManagementWebRuntimeConfig } from './runtime-config';

declare global {
  var __METABOOST_MANAGEMENT_RUNTIME_CONFIG__: ManagementWebRuntimeConfig | undefined;
}

export const setRuntimeConfig = (runtimeConfig: ManagementWebRuntimeConfig): void => {
  globalThis.__METABOOST_MANAGEMENT_RUNTIME_CONFIG__ = runtimeConfig;
};

export const hasRuntimeConfig = (): boolean =>
  globalThis.__METABOOST_MANAGEMENT_RUNTIME_CONFIG__ !== undefined;

function buildFromProcessEnv(): ManagementWebRuntimeConfig {
  return {
    env: {
      NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL:
        process.env.NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL,
      NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH: process.env.NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH,
      NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS:
        process.env.NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS,
      NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME: process.env.NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME,
      NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN: process.env.NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN,
      NEXT_PUBLIC_WEB_BASE_URL: process.env.NEXT_PUBLIC_WEB_BASE_URL,
      NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
      NEXT_PUBLIC_SUPPORTED_LOCALES: process.env.NEXT_PUBLIC_SUPPORTED_LOCALES,
      MANAGEMENT_API_SERVER_BASE_URL: process.env.MANAGEMENT_API_SERVER_BASE_URL,
    },
  };
}

export const getRuntimeConfig = (): ManagementWebRuntimeConfig => {
  const runtimeConfig = globalThis.__METABOOST_MANAGEMENT_RUNTIME_CONFIG__;
  if (runtimeConfig !== undefined) {
    return runtimeConfig;
  }
  return buildFromProcessEnv();
};
