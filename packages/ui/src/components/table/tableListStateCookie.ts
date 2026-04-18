/**
 * Client + server helpers for persisting table search / filter columns / page / optional timeline sort
 * in a JSON cookie map keyed by list id (same keys as sort prefs list keys).
 */

import { COOKIE_MAX_AGE_DAYS, ONE_DAY_SECONDS } from '@metaboost/helpers';

const COOKIE_PATH = '/';

export type TableListStateEntry = {
  search?: string;
  filterColumns?: string;
  page?: number;
  /** Events list: recent vs oldest (distinct from column sortBy/sortOrder). */
  timelineSort?: 'recent' | 'oldest';
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
 * Parse raw cookie string from the request (server-safe).
 */
export function getTableListStateMapFromCookieValue(
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

function parseEntry(raw: unknown): TableListStateEntry | null {
  if (raw === undefined || raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const entry: TableListStateEntry = {};
  if (typeof o.search === 'string') entry.search = o.search;
  if (typeof o.filterColumns === 'string') entry.filterColumns = o.filterColumns;
  if (typeof o.page === 'number' && Number.isFinite(o.page) && o.page >= 1) {
    entry.page = Math.floor(o.page);
  }
  if (o.timelineSort === 'recent' || o.timelineSort === 'oldest') {
    entry.timelineSort = o.timelineSort;
  }
  return Object.keys(entry).length > 0 ? entry : {};
}

/**
 * Read one list's persisted table UI state from a raw cookie value (server-safe).
 */
export function getTableListStateEntryFromCookieValue(
  cookieValue: string | undefined,
  listKey: string
): TableListStateEntry | null {
  const map = getTableListStateMapFromCookieValue(cookieValue);
  const raw = map[listKey];
  if (raw === undefined) return null;
  return parseEntry(raw);
}

/**
 * Read one list's table UI state from the browser cookie (client-only).
 */
export function getTableListStateEntryFromCookie(
  cookieName: string,
  listKey: string
): TableListStateEntry | null {
  if (!isClient()) return null;
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + encodeURIComponent(cookieName) + '=([^;]*)')
  );
  const raw = match?.[1];
  if (raw === undefined) {
    return getTableListStateEntryFromCookieValue(undefined, listKey);
  }
  try {
    const decoded = decodeURIComponent(raw);
    return getTableListStateEntryFromCookieValue(decoded, listKey);
  } catch {
    return getTableListStateEntryFromCookieValue(undefined, listKey);
  }
}

function getTableListStateMapFromCookie(cookieName: string): Record<string, unknown> {
  if (!isClient()) return {};
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

function writeCookieMap(cookieName: string, map: Record<string, unknown>): void {
  if (!isClient()) return;
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

/**
 * Merge partial state for a list key and persist (client-only).
 */
export function mergeTableListStateInCookie(
  cookieName: string,
  listKey: string,
  patch: Partial<TableListStateEntry>
): void {
  if (!isClient()) return;
  const existing = getTableListStateMapFromCookie(cookieName);
  const prevRaw = existing[listKey];
  const prev = parseEntry(prevRaw) ?? {};
  const nextEntry: TableListStateEntry = { ...prev, ...patch };
  const cleaned: Record<string, unknown> = {};
  if (nextEntry.search !== undefined) cleaned.search = nextEntry.search;
  if (nextEntry.filterColumns !== undefined) cleaned.filterColumns = nextEntry.filterColumns;
  if (nextEntry.page !== undefined) cleaned.page = nextEntry.page;
  if (nextEntry.timelineSort !== undefined) cleaned.timelineSort = nextEntry.timelineSort;
  const next = { ...existing, [listKey]: cleaned };
  writeCookieMap(cookieName, next);
}
