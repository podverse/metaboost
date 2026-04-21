import { request } from '@metaboost/helpers-requests';

export type PublicExchangeRatesConversion = {
  source: {
    currency: string;
    amountMinor: number;
    amountUnit: string;
  };
  conversions: Array<{
    currency: string;
    amountMinor: number;
    amountUnit: string;
  }>;
  metadata: {
    exchangeRatesFetchedAt: string;
    fiatBaseCurrency: string;
    serverStandardCurrency: string;
    supportedCurrencies: string[];
    currencyUnits: Record<string, string>;
  };
};

export async function reqFetchPublicExchangeRates(
  baseUrl: string,
  input: {
    sourceCurrency: string;
    sourceAmountMinor: number;
    amountUnit: string;
  }
) {
  const params = new URLSearchParams();
  params.set('source_currency', input.sourceCurrency);
  params.set('source_amount', String(input.sourceAmountMinor));
  params.set('amount_unit', input.amountUnit);
  return request<PublicExchangeRatesConversion>(baseUrl, `/exchange-rates?${params.toString()}`, {
    cache: 'no-store',
  });
}
