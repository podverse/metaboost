import { MBRSS_V1_CURRENCY_BTC, MBRSS_V1_SATOSHIS_UNIT } from '@metaboost/helpers';

export function normalizeCurrencyAndAmountUnit(input: { currency: string; amount_unit?: string }): {
  currency: string;
  amountUnit: string | null;
} {
  const currency = input.currency.trim().toUpperCase();
  const rawAmountUnit = input.amount_unit?.trim();
  if (rawAmountUnit === undefined || rawAmountUnit === '') {
    return { currency, amountUnit: null };
  }
  if (currency === MBRSS_V1_CURRENCY_BTC) {
    const normalizedAmountUnit = rawAmountUnit.toLowerCase();
    const amountUnit =
      normalizedAmountUnit === MBRSS_V1_SATOSHIS_UNIT || normalizedAmountUnit === 'satoshi'
        ? MBRSS_V1_SATOSHIS_UNIT
        : rawAmountUnit;
    return { currency, amountUnit };
  }
  return { currency, amountUnit: rawAmountUnit };
}
