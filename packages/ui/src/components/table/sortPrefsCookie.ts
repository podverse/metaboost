/**
 * Client-only helpers for persisting table sort preferences in a cookie.
 * Cookie value is a JSON object keyed by list/path identifier.
 * Values may be SortPref (sortBy, sortOrder) or { sort: 'recent' | 'oldest' } for messages.
 */

import { COOKIE_MAX_AGE_DAYS, ONE_DAY_SECONDS } from '@boilerplate/helpers';

const COOKIE_PATH = '/';

/** Path-based key for messages sort (recent/oldest) in the cookie map. */
export const BUCKET_DETAIL_MESSAGES_KEY = 'bucket-detail-messages';

/** Path-based key for bucket detail buckets table sort (sortBy/sortOrder) in the cookie map. */
export const BUCKET_DETAIL_BUCKETS_LIST_KEY = 'bucket-detail-buckets';

export type SortPref = {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

function isClient(): boolean {
  return typeof document !== 'undefined';
}

function parseCookieValue(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Parse raw cookie value string (e.g. from request) into the prefs map.
 * Server-safe; no document access.
 */
export function getSortPrefsMapFromCookieValue(
  cookieValue: string | undefined
): Record<string, unknown> {
  if (cookieValue === undefined || cookieValue === '') return {};
  try {
    const decoded = cookieValue.indexOf('%') !== -1 ? decodeURIComponent(cookieValue) : cookieValue;
    const map = parseCookieValue(decoded);
    return map !== null ? map : {};
  } catch {
    return {};
  }
}

/**
 * Read messages sort (recent/oldest) from raw cookie value. Server-safe.
 */
export function getMessagesSortFromCookieValue(
  cookieValue: string | undefined
): 'recent' | 'oldest' | null {
  const map = getSortPrefsMapFromCookieValue(cookieValue);
  const entry = map[BUCKET_DETAIL_MESSAGES_KEY];
  if (entry === undefined || entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }
  const o = entry as Record<string, unknown>;
  const sort = o.sort;
  if (typeof sort !== 'string' || !isValidMessagesSort(sort)) {
    return null;
  }
  return sort;
}

function isValidMessagesSort(sort: string): sort is 'recent' | 'oldest' {
  return sort === 'recent' || sort === 'oldest';
}

/**
 * Read SortPref for a list key from raw cookie value. Server-safe.
 */
export function getSortPrefsFromCookieValue(
  cookieValue: string | undefined,
  listKey: string
): SortPref | null {
  const map = getSortPrefsMapFromCookieValue(cookieValue);
  const pref = map[listKey];
  if (pref === undefined || pref === null || typeof pref !== 'object' || Array.isArray(pref)) {
    return null;
  }
  const o = pref as Record<string, unknown>;
  if (
    typeof o.sortBy !== 'string' ||
    o.sortBy.trim() === '' ||
    !isValidSortOrder(String(o.sortOrder))
  ) {
    return null;
  }
  return { sortBy: o.sortBy.trim(), sortOrder: o.sortOrder as 'asc' | 'desc' };
}

function isValidSortOrder(order: string): order is 'asc' | 'desc' {
  return order === 'asc' || order === 'desc';
}

export function getSortPrefsFromCookie(cookieName: string, listKey: string): SortPref | null {
  if (!isClient()) return null;
  const map = getSortPrefsMapFromCookie(cookieName);
  const pref = map[listKey];
  if (pref === undefined || pref === null || typeof pref !== 'object' || Array.isArray(pref)) {
    return null;
  }
  const o = pref as Record<string, unknown>;
  if (
    typeof o.sortBy !== 'string' ||
    o.sortBy.trim() === '' ||
    !isValidSortOrder(String(o.sortOrder))
  ) {
    return null;
  }
  return { sortBy: o.sortBy.trim(), sortOrder: o.sortOrder as 'asc' | 'desc' };
}

export function getMessagesSortFromCookie(cookieName: string): 'recent' | 'oldest' | null {
  if (!isClient()) return null;
  const map = getSortPrefsMapFromCookie(cookieName);
  const entry = map[BUCKET_DETAIL_MESSAGES_KEY];
  if (entry === undefined || entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }
  const o = entry as Record<string, unknown>;
  const sort = o.sort;
  if (typeof sort !== 'string' || !isValidMessagesSort(sort)) {
    return null;
  }
  return sort;
}

export function setMessagesSortInCookie(cookieName: string, sort: 'recent' | 'oldest'): void {
  if (!isClient()) return;
  const existing = getSortPrefsMapFromCookie(cookieName);
  const next = { ...existing, [BUCKET_DETAIL_MESSAGES_KEY]: { sort } };
  writeCookieMap(cookieName, next);
}

export function setSortPrefInCookie(
  cookieName: string,
  listKey: string,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): void {
  if (!isClient()) return;
  const existing = getSortPrefsMapFromCookie(cookieName);
  const next = { ...existing, [listKey]: { sortBy, sortOrder } };
  writeCookieMap(cookieName, next);
}

function writeCookieMap(cookieName: string, map: Record<string, unknown>): void {
  const value = encodeURIComponent(JSON.stringify(map));
  const maxAge = COOKIE_MAX_AGE_DAYS * ONE_DAY_SECONDS;
  document.cookie =
    encodeURIComponent(cookieName) +
    '=' +
    value +
    '; path=' +
    COOKIE_PATH +
    '; max-age=' +
    maxAge +
    '; SameSite=Lax';
}

function getSortPrefsMapFromCookie(cookieName: string): Record<string, unknown> {
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + encodeURIComponent(cookieName) + '=([^;]*)')
  );
  const value = match?.[1];
  if (value === undefined) return {};
  try {
    const decoded = decodeURIComponent(value);
    const map = parseCookieValue(decoded);
    return map !== null ? map : {};
  } catch {
    return {};
  }
}
