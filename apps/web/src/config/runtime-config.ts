/**
 * Runtime config shape served by the sidecar and consumed by the Next.js app.
 */

export type WebRuntimeConfigEnvKey =
  | 'NEXT_PUBLIC_WEB_BRAND_NAME'
  | 'NEXT_PUBLIC_LEGAL_NAME'
  | 'NEXT_PUBLIC_API_PUBLIC_BASE_URL'
  | 'NEXT_PUBLIC_API_VERSION_PATH'
  | 'NEXT_PUBLIC_AUTH_MODE'
  | 'NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS'
  | 'NEXT_PUBLIC_WEB_BASE_URL'
  | 'NEXT_PUBLIC_DEFAULT_LOCALE'
  | 'NEXT_PUBLIC_SUPPORTED_LOCALES'
  | 'API_SERVER_BASE_URL';

export interface WebRuntimeConfig {
  env: Partial<Record<WebRuntimeConfigEnvKey, string>>;
}
