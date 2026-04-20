import type { ApiResponse } from '../request.js';

import { request } from '../request.js';

export type ManagementRegistryAppItem = {
  appId: string;
  displayName: string;
  status: 'active' | 'suspended' | 'revoked';
  globallyBlocked: boolean;
  globalBlockedId: string | null;
  globalBlockNote: string | null;
  blockedEverywhere: boolean;
  blockedEverywhereReason: 'registry' | 'global_override' | null;
};

export async function listRegistryApps(
  baseUrl: string,
  token?: string | null
): Promise<ApiResponse<{ apps: ManagementRegistryAppItem[] }>> {
  return request<{ apps: ManagementRegistryAppItem[] }>(baseUrl, '/apps', {
    token: token ?? undefined,
  });
}

export async function addGlobalBlockedApp(
  baseUrl: string,
  body: { appId: string; note?: string | null },
  token?: string | null
): Promise<
  ApiResponse<{
    blockedApp: {
      id: string;
      appId: string;
      note: string | null;
      createdAt: string;
    };
  }>
> {
  return request(baseUrl, '/apps/global-blocked', {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function removeGlobalBlockedApp(
  baseUrl: string,
  appId: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request(baseUrl, `/apps/global-blocked/${encodeURIComponent(appId)}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}
