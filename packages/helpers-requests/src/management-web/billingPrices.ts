import type { ApiResponse } from '../request.js';

import { request } from '../request.js';

export type BillingPriceWindowStatus = 'active' | 'scheduled' | 'historical';

export type BillingPriceWindowDto = {
  id: number;
  billingProductId: number;
  productCode: string;
  currencyCode: string;
  billingCadence: 'monthly' | 'annual';
  amountCents: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  source: string;
  status: BillingPriceWindowStatus;
};

export type BillingPriceAuditEntryDto = {
  id: number;
  billingPriceId: number | null;
  changedByManagementUserId: string | null;
  changeReason: string | null;
  previousAmountCents: number | null;
  newAmountCents: number | null;
  previousEffectiveFrom: string | null;
  previousEffectiveTo: string | null;
  newEffectiveFrom: string | null;
  newEffectiveTo: string | null;
  createdAt: string;
  currencyCode: string | null;
  billingCadence: 'monthly' | 'annual' | null;
  productCode: string | null;
};

export type BillingPriceWindowsPayload = {
  data: {
    windows: BillingPriceWindowDto[];
    defaultCurrency: string;
  };
};

export type BillingPriceAuditPayload = {
  data: {
    entries: BillingPriceAuditEntryDto[];
  };
};

export async function listBillingPriceWindows(
  baseUrl: string,
  token?: string | null
): Promise<ApiResponse<BillingPriceWindowsPayload>> {
  return request<BillingPriceWindowsPayload>(baseUrl, '/billing-prices/windows', {
    token: token ?? undefined,
  });
}

export async function listBillingPriceAudit(
  baseUrl: string,
  options?: { token?: string | null; limit?: number }
): Promise<ApiResponse<BillingPriceAuditPayload>> {
  const limit = options?.limit;
  const path =
    limit !== undefined && limit > 0
      ? `/billing-prices/audit?limit=${encodeURIComponent(String(limit))}`
      : '/billing-prices/audit';
  return request<BillingPriceAuditPayload>(baseUrl, path, {
    token: options?.token ?? undefined,
  });
}

export async function scheduleBillingPriceChange(
  baseUrl: string,
  body: {
    currencyCode: string;
    billingCadence: 'monthly' | 'annual';
    amountCents: number;
    effectiveFrom: string;
    changeReason?: string | null;
  },
  token?: string | null
): Promise<ApiResponse<{ data: { newPriceId: number } }>> {
  return request<{ data: { newPriceId: number } }>(baseUrl, '/billing-prices', {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}

export async function deprecateBillingPrice(
  baseUrl: string,
  priceId: number,
  body: { changeReason?: string | null },
  token?: string | null
): Promise<ApiResponse<unknown>> {
  return request<unknown>(baseUrl, `/billing-prices/${priceId}/deprecate`, {
    method: 'POST',
    body: JSON.stringify(body),
    token: token ?? undefined,
  });
}
