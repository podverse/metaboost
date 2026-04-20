/**
 * Cookie map keyed by bucket detail pathname (e.g. /bucket/shortId) for messages page
 * and optional include-blocked flag — avoids query-string navigation for in-app actions.
 */

import { COOKIE_MAX_AGE_DAYS, ONE_DAY_SECONDS } from '@metaboost/helpers';

import { parseCookieValue } from '../../lib/cookieJson';
import { isClient } from '../../lib/isClient';

const COOKIE_PATH = '/';

export type BucketDetailNavTab = 'messages' | 'buckets' | 'add-to-rss' | 'endpoint';

export type BucketDetailNavEntry = {
  messagesPage?: number;
  includeBlockedSenderMessages?: boolean;
};

function parseEntry(raw: unknown): BucketDetailNavEntry | null {
  if (raw === undefined || raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const entry: BucketDetailNavEntry = {};
  if (
    typeof o.messagesPage === 'number' &&
    Number.isFinite(o.messagesPage) &&
    o.messagesPage >= 1
  ) {
    entry.messagesPage = Math.floor(o.messagesPage);
  }
  if (o.includeBlockedSenderMessages === true) entry.includeBlockedSenderMessages = true;
  return entry;
}

/**
 * Read nav entry for a bucket path from the browser cookie (client-only).
 */
export function getBucketDetailNavEntryFromCookie(
  cookieName: string,
  pathKey: string
): BucketDetailNavEntry | null {
  if (!isClient() || pathKey === '') return null;
  const existing = getMapFromCookie(cookieName);
  const raw = existing[pathKey];
  return parseEntry(raw);
}

/**
 * Read nav entry for a bucket path from the raw cookie string (server-safe).
 */
export function getBucketDetailNavEntryFromCookieValue(
  cookieValue: string | undefined,
  pathKey: string
): BucketDetailNavEntry | null {
  if (cookieValue === undefined || cookieValue === '' || pathKey === '') return null;
  try {
    const decoded = cookieValue.indexOf('%') !== -1 ? decodeURIComponent(cookieValue) : cookieValue;
    const map = parseCookieValue(decoded);
    if (map === null) return null;
    const raw = map[pathKey];
    return parseEntry(raw);
  } catch {
    return null;
  }
}

function getMapFromCookie(cookieName: string): Record<string, unknown> {
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
 * Merge partial nav state for a bucket path (client-only).
 */
export function mergeBucketDetailNavInCookie(
  cookieName: string,
  pathKey: string,
  patch: Partial<BucketDetailNavEntry>
): void {
  if (!isClient()) return;
  const existing = getMapFromCookie(cookieName);
  const prev = parseEntry(existing[pathKey]) ?? {};
  const nextEntry: BucketDetailNavEntry = { ...prev, ...patch };
  if (patch.includeBlockedSenderMessages === false) {
    delete nextEntry.includeBlockedSenderMessages;
  }
  const cleaned: Record<string, unknown> = {};
  if (nextEntry.messagesPage !== undefined) cleaned.messagesPage = nextEntry.messagesPage;
  if (nextEntry.includeBlockedSenderMessages === true) {
    cleaned.includeBlockedSenderMessages = true;
  }
  const next = { ...existing, [pathKey]: cleaned };
  writeCookieMap(cookieName, next);
}
