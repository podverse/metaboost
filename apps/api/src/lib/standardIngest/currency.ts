import {
  CurrencyDenominationError,
  normalizeAmountUnitForCurrency,
  normalizeCurrencyCode,
} from '@metaboost/helpers-currency';

export function normalizeCurrencyAndAmountUnit(input: { currency: string; amount_unit?: string }): {
  currency: string;
  amountUnit: string;
} {
  const currency = normalizeCurrencyCode(input.currency);
  if (currency === null) {
    throw new CurrencyDenominationError('Unsupported currency code.');
  }
  const amountUnit = normalizeAmountUnitForCurrency({
    currency,
    amountUnit: input.amount_unit,
  });
  return { currency, amountUnit };
}
