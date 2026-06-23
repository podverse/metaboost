import { getRuntimeConfig } from '../config/runtime-config-store';

function getApiVersionPath(): string {
  const ver = getRuntimeConfig().env.NEXT_PUBLIC_API_VERSION_PATH?.trim();
  return ver && ver.startsWith('/') ? ver : '/v1';
}

function resolvePublicApiOrigin(configuredPublicBaseUrl: string): string {
  const trimmed = configuredPublicBaseUrl.replace(/\/$/, '');
  if (trimmed === '') {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    try {
      const configured = new URL(trimmed);
      if (configured.origin !== window.location.origin) {
        return window.location.origin;
      }
    } catch {
      // Fall through to configured URL when parsing fails.
    }
  }
  return trimmed;
}

export function getApiBaseUrl(): string {
  const configured = getRuntimeConfig().env.NEXT_PUBLIC_API_PUBLIC_BASE_URL ?? '';
  const origin = resolvePublicApiOrigin(configured);
  return origin.replace(/\/$/, '') + getApiVersionPath();
}
