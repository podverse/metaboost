/**
 * Runtime config shape served by the management-web sidecar and consumed by the Next.js app.
 */

export type ManagementWebRuntimeConfigEnvKey =
  | 'NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL'
  | 'NEXT_PUBLIC_MANAGEMENT_API_VERSION_PATH'
  | 'NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS'
  | 'NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME'
  | 'NEXT_PUBLIC_WEB_BASE_URL'
  | 'NEXT_PUBLIC_DEFAULT_LOCALE'
  | 'NEXT_PUBLIC_SUPPORTED_LOCALES'
  | 'MANAGEMENT_API_SERVER_BASE_URL';

export interface ManagementWebRuntimeConfig {
  env: Partial<Record<ManagementWebRuntimeConfigEnvKey, string>>;
}
