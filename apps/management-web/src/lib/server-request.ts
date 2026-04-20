import 'server-only';
import { cookies } from 'next/headers';

import { parseFilterColumns } from './parseFilterColumns';

export { parseFilterColumns };

/**
 * Builds a Cookie header string from the current request's cookies.
 * Use when making server-side API requests that should forward auth (e.g. management-api).
 */
export async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}
