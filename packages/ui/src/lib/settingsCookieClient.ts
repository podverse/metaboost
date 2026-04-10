'use client';

/// <reference lib="dom" />
import { getSettingsFromCookieValue } from './settingsCookie';

const DEFAULT_PATH = '/';
const DEFAULT_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export type SetSettingsCookieOptions = {
  path?: string;
  maxAge?: number;
};

/**
 * Read the first cookie with the given name from document.cookie.
 */
export function getSettingsCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') return undefined;
  const prefix = `${name}=`;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length).trim();
    }
  }
  return undefined;
}

/**
 * Merge updates into the current settings cookie and write it back.
 * Reads existing value, shallow-merges updates, then sets document.cookie.
 */
export function setSettingsCookie(
  name: string,
  updates: Record<string, unknown>,
  options?: SetSettingsCookieOptions
): void {
  try {
    const path = options?.path ?? DEFAULT_PATH;
    const maxAge = options?.maxAge ?? DEFAULT_MAX_AGE;
    const current = getSettingsCookieValue(name);
    const merged = { ...getSettingsFromCookieValue(current), ...updates };
    const value = encodeURIComponent(JSON.stringify(merged));
    document.cookie = `${name}=${value}; path=${path}; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // ignore
  }
}
