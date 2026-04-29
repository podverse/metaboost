import type { ApiResponse } from '../request.js';

import { request } from '../request.js';

/** Main-app user in bucket admin context (id, idText for URLs, username, displayName; email optional). */
export type BucketAdminUser = {
  id: string;
  idText: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
};

export type ManagementBucketAdmin = {
  id: string;
  bucketId: string;
  userId: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  createdAt: string;
  user: BucketAdminUser | null;
};

export type ManagementBucketAdminInvitation = {
  id: string;
  token: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  status: string;
  expiresAt: string;
};

export type CreateBucketAdminInvitationBody = {
  bucketCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
};

export type UpdateBucketAdminBody = {
  bucketCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
};

export async function listBucketAdmins(
  baseUrl: string,
  bucketId: string,
  token?: string | null
): Promise<ApiResponse<{ admins: ManagementBucketAdmin[] }>> {
  return request<{ admins: ManagementBucketAdmin[] }>(baseUrl, `/buckets/${bucketId}/admins`, {
    token: token ?? undefined,
  });
}

export async function getBucketAdmin(
  baseUrl: string,
  bucketId: string,
  userId: string,
  token?: string | null
): Promise<ApiResponse<{ admin: ManagementBucketAdmin }>> {
  return request<{ admin: ManagementBucketAdmin }>(
    baseUrl,
    `/buckets/${bucketId}/admins/${userId}`,
    { token: token ?? undefined }
  );
}

export async function updateBucketAdmin(
  baseUrl: string,
  bucketId: string,
  userId: string,
  body: UpdateBucketAdminBody,
  token?: string | null
): Promise<ApiResponse<{ admin: ManagementBucketAdmin }>> {
  return request<{ admin: ManagementBucketAdmin }>(
    baseUrl,
    `/buckets/${bucketId}/admins/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
      token: token ?? undefined,
    }
  );
}

export async function deleteBucketAdmin(
  baseUrl: string,
  bucketId: string,
  userId: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/buckets/${bucketId}/admins/${userId}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}

export async function listBucketAdminInvitations(
  baseUrl: string,
  bucketId: string,
  token?: string | null
): Promise<ApiResponse<{ invitations: ManagementBucketAdminInvitation[] }>> {
  return request<{ invitations: ManagementBucketAdminInvitation[] }>(
    baseUrl,
    `/buckets/${bucketId}/admin-invitations`,
    { token: token ?? undefined }
  );
}

export async function createBucketAdminInvitation(
  baseUrl: string,
  bucketId: string,
  body: CreateBucketAdminInvitationBody,
  token?: string | null
): Promise<ApiResponse<{ invitation: ManagementBucketAdminInvitation }>> {
  return request<{ invitation: ManagementBucketAdminInvitation }>(
    baseUrl,
    `/buckets/${bucketId}/admin-invitations`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      token: token ?? undefined,
    }
  );
}

export async function deleteBucketAdminInvitation(
  baseUrl: string,
  bucketId: string,
  invitationId: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/buckets/${bucketId}/admin-invitations/${invitationId}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}
