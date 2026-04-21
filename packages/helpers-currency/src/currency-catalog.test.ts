import { describe, expect, it } from 'vitest';

import {
  CurrencyDenominationError,
  normalizeCurrencyCode,
  normalizeAmountUnitForCurrency,
  roundHalfUp,
  toMinorAmountHalfUp,
} from './currency-catalog.js';

describe('currency-catalog', () => {
  it('normalizeCurrencyCode trims and matches supported codes', () => {
    expect(normalizeCurrencyCode(' usd ')).toBe('USD');
    expect(normalizeCurrencyCode(null)).toBeNull();
    expect(normalizeCurrencyCode('XXX')).toBeNull();
  });

  it('normalizeAmountUnitForCurrency validates unit for currency', () => {
    expect(normalizeAmountUnitForCurrency({ currency: 'USD', amountUnit: 'cents' })).toBe('cents');
    expect(() =>
      normalizeAmountUnitForCurrency({ currency: 'USD', amountUnit: 'invalid' })
    ).toThrow(CurrencyDenominationError);
  });

  it('roundHalfUp handles positive and negative halves', () => {
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(-1.5)).toBe(-2);
    expect(roundHalfUp(1.4)).toBe(1);
  });

  it('toMinorAmountHalfUp respects minor unit exponent', () => {
    expect(toMinorAmountHalfUp(10.505, 2)).toBe(1051);
    expect(toMinorAmountHalfUp(1, 8)).toBe(100000000);
  });
});
