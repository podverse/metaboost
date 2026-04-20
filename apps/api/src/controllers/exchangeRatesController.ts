import type { Request, Response } from 'express';

import {
  parseRequiredNonNegativeIntegerQueryParam,
  parseRequiredQueryStringParam,
} from '@metaboost/helpers';
import {
  CurrencyDenominationError,
  getCurrencyDenominationSpec,
  normalizeAmountUnitForCurrency,
  normalizeCurrencyCode,
} from '@metaboost/helpers-currency';
import { BucketService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';
import {
  convertToBaselineAmount,
  convertToBaselineMinorAmount,
  ExchangeRatesFetchDisabledError,
  getExchangeRates,
  getSupportedBaselineCurrencies,
} from '../lib/exchangeRates.js';

const MAJOR_RATIO_PRECISION = 16;

const toMajorRatioString = (value: number): string => {
  if (!Number.isFinite(value)) {
    throw new Error('Conversion ratio is not finite.');
  }
  return Number.parseFloat(value.toPrecision(MAJOR_RATIO_PRECISION)).toString();
};

/** Public: list cached exchange-rate conversions across supported currencies. */
export async function getPublicExchangeRates(req: Request, res: Response): Promise<void> {
  const sourceCurrencyRaw = parseRequiredQueryStringParam(req.query.source_currency);
  if (sourceCurrencyRaw === undefined) {
    res.status(400).json({
      message: 'source_currency is required.',
      errors: [{ field: 'source_currency', message: 'source_currency is required.' }],
    });
    return;
  }

  const sourceAmountMinor = parseRequiredNonNegativeIntegerQueryParam(req.query.source_amount);
  if (sourceAmountMinor === undefined) {
    res.status(400).json({
      message: 'source_amount must be a non-negative integer in minor units.',
      errors: [
        {
          field: 'source_amount',
          message: 'source_amount must be a non-negative integer in minor units.',
        },
      ],
    });
    return;
  }

  const sourceCurrency = normalizeCurrencyCode(sourceCurrencyRaw);
  if (sourceCurrency === null) {
    res.status(400).json({
      message: `Unsupported source_currency "${sourceCurrencyRaw}".`,
      errors: [
        {
          field: 'source_currency',
          message: `Unsupported source_currency "${sourceCurrencyRaw}".`,
        },
      ],
    });
    return;
  }

  const sourceAmountUnitRaw = parseRequiredQueryStringParam(req.query.amount_unit);
  if (sourceAmountUnitRaw === undefined) {
    res.status(400).json({
      message: `amount_unit is required for currency ${sourceCurrency}.`,
      errors: [
        {
          field: 'amount_unit',
          message: `amount_unit is required for currency ${sourceCurrency}.`,
        },
      ],
    });
    return;
  }

  let sourceAmountUnit: string;
  try {
    sourceAmountUnit = normalizeAmountUnitForCurrency({
      currency: sourceCurrency,
      amountUnit: sourceAmountUnitRaw,
    });
  } catch (error) {
    if (error instanceof CurrencyDenominationError) {
      res.status(400).json({
        message: error.message,
        errors: [{ field: 'amount_unit', message: error.message }],
      });
      return;
    }
    throw error;
  }

  let rates;
  try {
    rates = await getExchangeRates();
  } catch (error) {
    if (error instanceof ExchangeRatesFetchDisabledError) {
      res.status(503).json({ message: error.message });
      return;
    }
    throw error;
  }
  const supportedCurrencies = getSupportedBaselineCurrencies(rates);
  if (!supportedCurrencies.includes(sourceCurrency)) {
    res.status(503).json({
      message: `Conversion unavailable for source_currency ${sourceCurrency} with current cached rates.`,
    });
    return;
  }

  const conversions: Array<{
    currency: string;
    amountMinor: number;
    amountUnit: string;
  }> = [];
  const currencyUnits: Record<string, string> = {};

  for (const targetCurrency of supportedCurrencies) {
    const targetSpec = getCurrencyDenominationSpec(targetCurrency);
    if (targetSpec === null) {
      continue;
    }
    const convertedAmountMinor = convertToBaselineMinorAmount(
      {
        amount: sourceAmountMinor,
        currency: sourceCurrency,
        amountUnit: sourceAmountUnit,
      },
      targetCurrency,
      rates
    );
    if (convertedAmountMinor === null) {
      continue;
    }
    conversions.push({
      currency: targetCurrency,
      amountMinor: convertedAmountMinor,
      amountUnit: targetSpec.canonicalAmountUnit,
    });
    currencyUnits[targetCurrency] = targetSpec.canonicalAmountUnit;
  }

  res.status(200).json({
    source: {
      currency: sourceCurrency,
      amountMinor: sourceAmountMinor,
      amountUnit: sourceAmountUnit,
    },
    conversions,
    metadata: {
      exchangeRatesFetchedAt: new Date(rates.fetchedAtMs).toISOString(),
      fiatBaseCurrency: config.exchangeRatesFiatBaseCurrency,
      serverStandardCurrency: config.exchangeRatesServerStandardCurrency,
      supportedCurrencies,
      currencyUnits,
    },
  });
}

/** Public: return conversion ratio metadata for bucket preferred currency (clients convert locally). */
export async function getPublicBucketConversionRatios(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const resolved = await getBucketAndEffective(id);
  if (resolved === null || !resolved.bucket.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }

  const sourceCurrencyRaw = parseRequiredQueryStringParam(req.query.source_currency);
  if (sourceCurrencyRaw === undefined) {
    res.status(400).json({
      message: 'source_currency is required.',
      errors: [{ field: 'source_currency', message: 'source_currency is required.' }],
    });
    return;
  }

  const sourceCurrency = normalizeCurrencyCode(sourceCurrencyRaw);
  if (sourceCurrency === null) {
    res.status(400).json({
      message: `Unsupported source_currency "${sourceCurrencyRaw}".`,
      errors: [
        {
          field: 'source_currency',
          message: `Unsupported source_currency "${sourceCurrencyRaw}".`,
        },
      ],
    });
    return;
  }

  const sourceAmountUnitRaw = parseRequiredQueryStringParam(req.query.amount_unit);
  if (sourceAmountUnitRaw === undefined) {
    res.status(400).json({
      message: `amount_unit is required for currency ${sourceCurrency}.`,
      errors: [
        {
          field: 'amount_unit',
          message: `amount_unit is required for currency ${sourceCurrency}.`,
        },
      ],
    });
    return;
  }

  let sourceAmountUnit: string;
  try {
    sourceAmountUnit = normalizeAmountUnitForCurrency({
      currency: sourceCurrency,
      amountUnit: sourceAmountUnitRaw,
    });
  } catch (error) {
    if (error instanceof CurrencyDenominationError) {
      res.status(400).json({
        message: error.message,
        errors: [{ field: 'amount_unit', message: error.message }],
      });
      return;
    }
    throw error;
  }

  const preferredCurrencyRaw =
    resolved.bucket.settings?.preferredCurrency ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
  const preferredCurrency =
    normalizeCurrencyCode(preferredCurrencyRaw) ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
  const sourceSpec = getCurrencyDenominationSpec(sourceCurrency);
  const preferredSpec = getCurrencyDenominationSpec(preferredCurrency);
  if (sourceSpec === null || preferredSpec === null) {
    res.status(500).json({ message: 'Bucket preferred currency is not configured correctly.' });
    return;
  }

  let rates;
  try {
    rates = await getExchangeRates();
  } catch (error) {
    if (error instanceof ExchangeRatesFetchDisabledError) {
      res.status(503).json({ message: error.message });
      return;
    }
    throw error;
  }
  const oneSourceMajorInMinor = 10 ** sourceSpec.minorUnitExponent;
  const sourceMajorToTargetMajor = convertToBaselineAmount(
    {
      amount: oneSourceMajorInMinor,
      currency: sourceCurrency,
      amountUnit: sourceAmountUnit,
    },
    preferredCurrency,
    rates
  );
  if (
    sourceMajorToTargetMajor === null ||
    !Number.isFinite(sourceMajorToTargetMajor) ||
    sourceMajorToTargetMajor <= 0
  ) {
    res.status(503).json({
      message: 'Conversion unavailable for the requested currency pair with current cached rates.',
    });
    return;
  }

  const targetMajorToSourceMajor = 1 / sourceMajorToTargetMajor;
  res.status(200).json({
    source: {
      currency: sourceCurrency,
      amountUnit: sourceAmountUnit,
      minorUnitExponent: sourceSpec.minorUnitExponent,
    },
    target: {
      currency: preferredCurrency,
      amountUnit: preferredSpec.canonicalAmountUnit,
      minorUnitExponent: preferredSpec.minorUnitExponent,
    },
    ratio: {
      sourceMajorToTargetMajor: toMajorRatioString(sourceMajorToTargetMajor),
      targetMajorToSourceMajor: toMajorRatioString(targetMajorToSourceMajor),
      roundingMode: 'half_up',
    },
    metadata: {
      exchangeRatesFetchedAt: new Date(rates.fetchedAtMs).toISOString(),
      fiatBaseCurrency: config.exchangeRatesFiatBaseCurrency,
      serverStandardCurrency: config.exchangeRatesServerStandardCurrency,
    },
  });
}
