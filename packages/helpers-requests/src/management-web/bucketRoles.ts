import type { ApiResponse } from '../request.js';

import { request } from '../request.js';

/** Predefined role item (id is everything|bucket_full|read_everything|bucket_read). */
export type PredefinedBucketRoleItem = {
  id: string;
  nameKey: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  isPredefined: true;
  createdAt: null;
};

/** Custom role item (id is UUID). */
export type CustomBucketRoleItem = {
  id: string;
  name: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  isPredefined: false;
  createdAt: string;
};

/** Role item from GET /buckets/:id/roles (predefined or custom). */
export type BucketRoleItem = PredefinedBucketRoleItem | CustomBucketRoleItem;

export function isPredefinedRole(role: BucketRoleItem): role is PredefinedBucketRoleItem {
  return role.isPredefined === true;
}

export type CreateBucketRoleBody = {
  name: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
};

export type UpdateBucketRoleBody = {
  name?: string;
  bucketCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
};

export async function listBucketRoles(
  baseUrl: string,
  bucketId: string,
  token?: string | null
): Promise<ApiResponse<{ roles: BucketRoleItem[] }>> {
  return request<{ roles: BucketRoleItem[] }>(baseUrl, `/buckets/${bucketId}/roles`, {
    token: token ?? undefined,
  });
}

export async function createBucketRole(
  baseUrl: string,
  bucketId: string,
  body: CreateBucketRoleBody,
  token?: string | null
): Promise<ApiResponse<{ role: CustomBucketRoleItem }>> {
  return request<{ role: CustomBucketRoleItem }>(baseUrl, `/buckets/${bucketId}/roles`, {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function updateBucketRole(
  baseUrl: string,
  bucketId: string,
  roleId: string,
  body: UpdateBucketRoleBody,
  token?: string | null
): Promise<ApiResponse<{ role: CustomBucketRoleItem }>> {
  return request<{ role: CustomBucketRoleItem }>(baseUrl, `/buckets/${bucketId}/roles/${roleId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function deleteBucketRole(
  baseUrl: string,
  bucketId: string,
  roleId: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/buckets/${bucketId}/roles/${roleId}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}
