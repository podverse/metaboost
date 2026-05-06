import type { ApiResponse } from '../request.js';
import type {
  AuthenticatedBillingMembershipReadModelData,
  PublicProductMembershipReadModelData,
} from '../types/billing-read-model-types.js';

import { request } from '../request.js';

export type PublicProductMembershipPayload = {
  data: PublicProductMembershipReadModelData;
};

export type AuthenticatedBillingMembershipPayload = {
  data: AuthenticatedBillingMembershipReadModelData;
};

/** GET /product/membership — public resolved pricing/trial and signup visibility (no auth). */
export async function getPublicProductMembership(
  baseUrl: string
): Promise<ApiResponse<PublicProductMembershipPayload>> {
  return request<PublicProductMembershipPayload>(baseUrl, '/product/membership');
}

/** GET /auth/billing/membership-summary — session cookie or Bearer token. */
export async function getBillingMembershipSummary(
  baseUrl: string,
  token?: string | null
): Promise<ApiResponse<AuthenticatedBillingMembershipPayload>> {
  return request<AuthenticatedBillingMembershipPayload>(
    baseUrl,
    '/auth/billing/membership-summary',
    { token: token ?? undefined }
  );
}
