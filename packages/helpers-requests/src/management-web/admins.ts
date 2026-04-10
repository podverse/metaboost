import type { ApiResponse } from '../request.js';
import type {
  CreateAdminBody,
  ListAdminsData,
  PublicManagementUser,
  UpdateAdminBody,
} from '../types/management-admin-types.js';

import { request } from '../request.js';

/** Token optional; omit for cookie auth (credentials: 'include'). */
export async function list(
  baseUrl: string,
  token?: string | null
): Promise<ApiResponse<ListAdminsData>> {
  return request<ListAdminsData>(baseUrl, '/admins', { token: token ?? undefined });
}

export async function getAdmin(
  baseUrl: string,
  id: string,
  token?: string | null
): Promise<ApiResponse<{ admin: PublicManagementUser }>> {
  return request<{ admin: PublicManagementUser }>(baseUrl, `/admins/${id}`, {
    token: token ?? undefined,
  });
}

export async function createAdmin(
  baseUrl: string,
  body: CreateAdminBody,
  token?: string | null
): Promise<ApiResponse<{ admin: PublicManagementUser }>> {
  return request<{ admin: PublicManagementUser }>(baseUrl, '/admins', {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function updateAdmin(
  baseUrl: string,
  id: string,
  body: UpdateAdminBody,
  token?: string | null
): Promise<ApiResponse<{ admin: PublicManagementUser }>> {
  return request<{ admin: PublicManagementUser }>(baseUrl, `/admins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function deleteAdmin(
  baseUrl: string,
  id: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/admins/${id}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}
