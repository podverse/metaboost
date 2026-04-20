export type SupportedCurrency =
  | 'USD'
  | 'BTC'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CHF'
  | 'NZD'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'INR'
  | 'BRL'
  | 'MXN'
  | 'ZAR'
  | 'SGD'
  | 'HKD'
  | 'KRW';

type CurrencyDenominationSpec = {
  code: SupportedCurrency;
  minorUnitExponent: number;
  canonicalAmountUnit: string;
  acceptedAmountUnits: readonly string[];
};

const CURRENCY_DENOMINATION_SPECS: readonly CurrencyDenominationSpec[] = [
  {
    code: 'USD',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'cent',
    acceptedAmountUnits: ['cent'],
  },
  {
    code: 'BTC',
    minorUnitExponent: 8,
    canonicalAmountUnit: 'satoshi',
    acceptedAmountUnits: ['satoshi'],
  },
  {
    code: 'EUR',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'cent',
    acceptedAmountUnits: ['cent'],
  },
  {
    code: 'GBP',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'pence',
    acceptedAmountUnits: ['pence'],
  },
  {
    code: 'CAD',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'cent',
    acceptedAmountUnits: ['cent'],
  },
  {
    code: 'AUD',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'cent',
    acceptedAmountUnits: ['cent'],
  },
  { code: 'JPY', minorUnitExponent: 0, canonicalAmountUnit: 'yen', acceptedAmountUnits: ['yen'] },
  {
    code: 'CHF',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'rappen',
    acceptedAmountUnits: ['rappen'],
  },
  {
    code: 'NZD',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'cent',
    acceptedAmountUnits: ['cent'],
  },
  { code: 'SEK', minorUnitExponent: 2, canonicalAmountUnit: 'ore', acceptedAmountUnits: ['ore'] },
  { code: 'NOK', minorUnitExponent: 2, canonicalAmountUnit: 'ore', acceptedAmountUnits: ['ore'] },
  { code: 'DKK', minorUnitExponent: 2, canonicalAmountUnit: 'ore', acceptedAmountUnits: ['ore'] },
  {
    code: 'INR',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'paise',
    acceptedAmountUnits: ['paise'],
  },
  {
    code: 'BRL',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'centavo',
    acceptedAmountUnits: ['centavo'],
  },
  {
    code: 'MXN',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'centavo',
    acceptedAmountUnits: ['centavo'],
  },
  {
    code: 'ZAR',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'cent',
    acceptedAmountUnits: ['cent'],
  },
  {
    code: 'SGD',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'cent',
    acceptedAmountUnits: ['cent'],
  },
  {
    code: 'HKD',
    minorUnitExponent: 2,
    canonicalAmountUnit: 'cent',
    acceptedAmountUnits: ['cent'],
  },
  { code: 'KRW', minorUnitExponent: 0, canonicalAmountUnit: 'won', acceptedAmountUnits: ['won'] },
];

export const SUPPORTED_CURRENCIES_ORDERED: readonly SupportedCurrency[] =
  CURRENCY_DENOMINATION_SPECS.map((spec) => spec.code);

export class CurrencyDenominationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CurrencyDenominationError';
  }
}

export function normalizeCurrencyCode(value: string | null | undefined): SupportedCurrency | null {
  if (typeof value !== 'string') {
    return null;
  }
  const upper = value.trim().toUpperCase();
  if (upper === '') {
    return null;
  }
  return CURRENCY_DENOMINATION_SPECS.some((spec) => spec.code === (upper as SupportedCurrency))
    ? (upper as SupportedCurrency)
    : null;
}

export function getCurrencyDenominationSpec(
  currency: string | null | undefined
): CurrencyDenominationSpec | null {
  const normalized = normalizeCurrencyCode(currency);
  if (normalized === null) {
    return null;
  }
  return CURRENCY_DENOMINATION_SPECS.find((spec) => spec.code === normalized) ?? null;
}

export function normalizeAmountUnitForCurrency(input: {
  currency: string | null | undefined;
  amountUnit: string | null | undefined;
}): string {
  const spec = getCurrencyDenominationSpec(input.currency);
  if (spec === null) {
    throw new CurrencyDenominationError('Unsupported currency code.');
  }
  const raw = typeof input.amountUnit === 'string' ? input.amountUnit.trim().toLowerCase() : '';
  if (raw === '') {
    throw new CurrencyDenominationError(`amount_unit is required for currency ${spec.code}.`);
  }
  if (!spec.acceptedAmountUnits.includes(raw)) {
    throw new CurrencyDenominationError(
      `Invalid amount_unit "${input.amountUnit}" for currency ${spec.code}.`
    );
  }
  return spec.canonicalAmountUnit;
}

export function toMajorAmountFromMinor(amountMinor: number, minorUnitExponent: number): number {
  return amountMinor / 10 ** minorUnitExponent;
}

export function roundHalfUp(value: number): number {
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}

export function toMinorAmountHalfUp(amountMajor: number, minorUnitExponent: number): number {
  return roundHalfUp(amountMajor * 10 ** minorUnitExponent);
}
