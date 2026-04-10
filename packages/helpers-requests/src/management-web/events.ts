import type { ApiError } from '../request.js';
import type { ListEventsData } from '../types/management-event-types.js';

import { request } from '../request.js';

/** Token optional; omit for cookie auth (credentials: 'include'). */
export async function list(
  baseUrl: string,
  token?: string | null
): Promise<{
  ok: boolean;
  status: number;
  data?: ListEventsData;
  error?: ApiError;
}> {
  return request<ListEventsData>(baseUrl, '/events', { token: token ?? undefined });
}
