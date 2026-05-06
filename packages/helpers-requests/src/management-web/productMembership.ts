import type { ApiResponse } from '../request.js';
import type { ResolvedProductMembership } from '@metaboost/helpers';

import { request } from '../request.js';

export type ResolvedProductMembershipResponse = {
  data: ResolvedProductMembership;
};

/** Requires `billingPrices` read permission (super admin bypasses); uses cookie auth when token omitted. */
export async function getResolvedProductMembership(
  baseUrl: string,
  token?: string | null
): Promise<ApiResponse<ResolvedProductMembershipResponse>> {
  return request<ResolvedProductMembershipResponse>(baseUrl, '/product/membership', {
    token: token ?? undefined,
  });
}
