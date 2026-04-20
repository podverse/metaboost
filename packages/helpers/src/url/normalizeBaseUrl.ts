export function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/$/, '');
}
