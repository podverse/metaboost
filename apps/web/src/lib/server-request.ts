import 'server-only';
import { cookies } from 'next/headers';

import { parseFilterColumns as parseSharedFilterColumns } from '@metaboost/helpers';

import { getServerApiBaseUrl } from '../config/env';

export { getServerApiBaseUrl };

/**
 * Builds a Cookie header string from the current request's cookies.
 * Use when making server-side API requests that should forward auth.
 */
export async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}

/**
 * Parses filterColumns from searchParams and returns only valid column ids.
 * When empty or invalid, returns validColumnIds (all columns).
 */
export function parseFilterColumns(
  resolvedSearchParams: { filterColumns?: string },
  validColumnIds: string[]
): string[] {
  return parseSharedFilterColumns(resolvedSearchParams, validColumnIds);
}
