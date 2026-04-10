import type { ApiResponse } from '../request.js';
import type { EventVisibility } from '../types/management-admin-types.js';

import { request } from '../request.js';

export type PredefinedManagementAdminRoleItem = {
  id: string;
  nameKey: string;
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: EventVisibility;
  isPredefined: true;
  createdAt: null;
};

export type CustomManagementAdminRoleItem = {
  id: string;
  name: string;
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: EventVisibility;
  isPredefined: false;
  createdAt: string;
};

export type ManagementAdminRoleItem =
  | PredefinedManagementAdminRoleItem
  | CustomManagementAdminRoleItem;

export type CreateManagementAdminRoleBody = {
  name: string;
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: EventVisibility;
};

export type UpdateManagementAdminRoleBody = {
  name?: string;
  adminsCrud?: number;
  usersCrud?: number;
  bucketsCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
  eventVisibility?: EventVisibility;
};

export async function listManagementAdminRoles(
  baseUrl: string,
  token?: string | null
): Promise<ApiResponse<{ roles: ManagementAdminRoleItem[] }>> {
  return request<{ roles: ManagementAdminRoleItem[] }>(baseUrl, '/admins/roles', {
    token: token ?? undefined,
  });
}

export async function createManagementAdminRole(
  baseUrl: string,
  body: CreateManagementAdminRoleBody,
  token?: string | null
): Promise<ApiResponse<{ role: CustomManagementAdminRoleItem }>> {
  return request<{ role: CustomManagementAdminRoleItem }>(baseUrl, '/admins/roles', {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function updateManagementAdminRole(
  baseUrl: string,
  roleId: string,
  body: UpdateManagementAdminRoleBody,
  token?: string | null
): Promise<ApiResponse<{ role: CustomManagementAdminRoleItem }>> {
  return request<{ role: CustomManagementAdminRoleItem }>(baseUrl, `/admins/roles/${roleId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function deleteManagementAdminRole(
  baseUrl: string,
  roleId: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/admins/roles/${roleId}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}
