import type { ApiResponse } from '../request.js';
import type {
  CreateTermsVersionBody,
  ListTermsVersionsData,
  ManagementTermsVersion,
  UpdateTermsVersionBody,
} from '../types/management-terms-types.js';

import { request } from '../request.js';

export async function reqListTermsVersions(
  baseUrl: string,
  token?: string | null
): Promise<ApiResponse<ListTermsVersionsData>> {
  return request<ListTermsVersionsData>(baseUrl, '/terms-versions', { token: token ?? undefined });
}

export async function reqGetTermsVersion(
  baseUrl: string,
  id: string,
  token?: string | null
): Promise<ApiResponse<{ termsVersion: ManagementTermsVersion }>> {
  return request<{ termsVersion: ManagementTermsVersion }>(
    baseUrl,
    `/terms-versions/${encodeURIComponent(id)}`,
    { token: token ?? undefined }
  );
}

export async function reqCreateTermsVersion(
  baseUrl: string,
  body: CreateTermsVersionBody,
  token?: string | null
): Promise<ApiResponse<{ termsVersion: ManagementTermsVersion }>> {
  return request<{ termsVersion: ManagementTermsVersion }>(baseUrl, '/terms-versions', {
    method: 'POST',
    token: token ?? undefined,
    body: JSON.stringify(body),
  });
}

export async function reqUpdateTermsVersion(
  baseUrl: string,
  id: string,
  body: UpdateTermsVersionBody,
  token?: string | null
): Promise<ApiResponse<{ termsVersion: ManagementTermsVersion }>> {
  return request<{ termsVersion: ManagementTermsVersion }>(
    baseUrl,
    `/terms-versions/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      token: token ?? undefined,
      body: JSON.stringify(body),
    }
  );
}

export async function reqPromoteTermsVersionToCurrent(
  baseUrl: string,
  id: string,
  token?: string | null
): Promise<ApiResponse<{ termsVersion: ManagementTermsVersion }>> {
  return request<{ termsVersion: ManagementTermsVersion }>(
    baseUrl,
    `/terms-versions/${encodeURIComponent(id)}/promote-to-current`,
    {
      method: 'POST',
      token: token ?? undefined,
    }
  );
}
