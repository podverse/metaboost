import type { ApiResponse } from '../request.js';
import type {
  ChangeUserPasswordBody,
  CreateUserBody,
  ListUsersData,
  PublicMainAppUser,
  UpdateUserBody,
} from '../types/management-user-types.js';

import { request } from '../request.js';

/** Token optional; omit for cookie auth (credentials: 'include'). */
export async function list(
  baseUrl: string,
  token?: string | null
): Promise<ApiResponse<ListUsersData>> {
  return request<ListUsersData>(baseUrl, '/users', { token: token ?? undefined });
}

export async function getUser(
  baseUrl: string,
  id: string,
  token?: string | null
): Promise<ApiResponse<{ user: PublicMainAppUser }>> {
  return request<{ user: PublicMainAppUser }>(baseUrl, `/users/${id}`, {
    token: token ?? undefined,
  });
}

export type CreateUserResponse = {
  user: PublicMainAppUser;
  /** Present when password was omitted (set-password link flow). */
  setPasswordLink?: string;
};

export async function createUser(
  baseUrl: string,
  body: CreateUserBody,
  token?: string | null
): Promise<ApiResponse<CreateUserResponse>> {
  return request<CreateUserResponse>(baseUrl, '/users', {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function updateUser(
  baseUrl: string,
  id: string,
  body: UpdateUserBody,
  token?: string | null
): Promise<ApiResponse<{ user: PublicMainAppUser }>> {
  return request<{ user: PublicMainAppUser }>(baseUrl, `/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function deleteUser(
  baseUrl: string,
  id: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/users/${id}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}

export async function changeUserPassword(
  baseUrl: string,
  id: string,
  body: ChangeUserPasswordBody,
  token?: string | null
): Promise<ApiResponse<void>> {
  return request<void>(baseUrl, `/users/${id}/change-password`, {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}
