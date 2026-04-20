import type { ApiResponse } from '../request.js';
import type { PublicExchangeRatesConversion } from '../types/bucket-types.js';

import { request } from '../request.js';

const SERVER_OPTIONS = { cache: 'no-store' as RequestCache } as const;

export async function reqFetchPublicExchangeRates(
  baseUrl: string,
  input: {
    sourceCurrency: string;
    sourceAmountMinor: number;
    amountUnit: string;
  }
): Promise<ApiResponse<PublicExchangeRatesConversion>> {
  const params = new URLSearchParams();
  params.set('source_currency', input.sourceCurrency);
  params.set('source_amount', String(input.sourceAmountMinor));
  params.set('amount_unit', input.amountUnit);
  return request<PublicExchangeRatesConversion>(baseUrl, `/exchange-rates?${params.toString()}`, {
    ...SERVER_OPTIONS,
  });
}
