import { getRuntimeConfig } from '../config/runtime-config-store';

function getApiVersionPath(): string {
  const ver = getRuntimeConfig().env.NEXT_PUBLIC_API_VERSION_PATH?.trim();
  return ver && ver.startsWith('/') ? ver : '/v1';
}

export function getApiBaseUrl(): string {
  const base = getRuntimeConfig().env.NEXT_PUBLIC_API_PUBLIC_BASE_URL ?? '';
  const trimmed = base.replace(/\/$/, '');
  return trimmed + getApiVersionPath();
}
