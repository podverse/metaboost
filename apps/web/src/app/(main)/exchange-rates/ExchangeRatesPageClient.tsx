'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { isNonNegativeInteger } from '@metaboost/helpers';
import {
  getCurrencyDenominationSpec,
  normalizeCurrencyCode,
  SUPPORTED_CURRENCIES_ORDERED,
} from '@metaboost/helpers-currency';
import { formatDateTimeReadable } from '@metaboost/helpers-i18n/client';
import { Button, FormContainer, Input, Select, Stack, Table, Text } from '@metaboost/ui';

import { getApiBaseUrl } from '../../../lib/api-client';
import {
  reqFetchPublicExchangeRates,
  type PublicExchangeRatesConversion,
} from '../../../lib/exchangeRates';

type ExchangeRatesPageClientProps = {
  initialData: PublicExchangeRatesConversion | null;
  initialError: string | null;
};

const SUPPORTED_CURRENCIES = [...SUPPORTED_CURRENCIES_ORDERED];
const CURRENCY_UNITS_BY_CODE: Record<string, string> = SUPPORTED_CURRENCIES.reduce<
  Record<string, string>
>((acc, currency) => {
  const denominationSpec = getCurrencyDenominationSpec(currency);
  if (denominationSpec !== null) {
    acc[currency] = denominationSpec.canonicalAmountUnit;
  }
  return acc;
}, {});

function buildCurrencyLabel(currency: string): string {
  if (currency === 'BTC') {
    return 'BTC (sats)';
  }
  return currency;
}

export function ExchangeRatesPageClient({
  initialData,
  initialError,
}: ExchangeRatesPageClientProps) {
  const t = useTranslations('exchangeRatesPage');
  const tBuckets = useTranslations('buckets');
  const locale = useLocale();
  const [data, setData] = useState<PublicExchangeRatesConversion | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const resolvedInitialSourceCurrency =
    normalizeCurrencyCode(initialData?.source.currency) ?? 'USD';
  const [sourceCurrency, setSourceCurrency] = useState<string>(resolvedInitialSourceCurrency);
  const [sourceAmountMinor, setSourceAmountMinor] = useState<string>(
    initialData?.source.amountMinor !== undefined ? String(initialData.source.amountMinor) : '100'
  );

  const sourceAmountUnit = CURRENCY_UNITS_BY_CODE[sourceCurrency] ?? '';
  const currencyOptions = useMemo(
    () =>
      SUPPORTED_CURRENCIES.map((currencyCode) => ({
        value: currencyCode,
        label: buildCurrencyLabel(currencyCode),
      })),
    []
  );
  const freshnessText =
    data !== null ? formatDateTimeReadable(locale, data.metadata.exchangeRatesFetchedAt) : null;
  const formatAmountMinor = (amountMinor: number): string =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amountMinor);
  const formatAmountUnitLabel = (amountUnit: string): string => {
    const normalizedAmountUnit = amountUnit.trim().toLowerCase();
    if (normalizedAmountUnit === '') {
      return t('unknownAmountUnit');
    }
    const translationKey = `currencyMinorUnits.${normalizedAmountUnit}`;
    const translated = tBuckets(translationKey);
    return translated === translationKey ? normalizedAmountUnit : translated;
  };

  return (
    <Stack>
      <Text as="p">{t('description')}</Text>
      <FormContainer
        onSubmit={(event) => {
          event.preventDefault();
          const parsedAmountMinor = Number(sourceAmountMinor);
          if (!isNonNegativeInteger(parsedAmountMinor)) {
            setError(t('invalidAmountMinor'));
            return;
          }
          if (sourceAmountUnit === '') {
            setError(t('currencyUnavailable'));
            return;
          }
          void (async () => {
            setLoading(true);
            setError(null);
            try {
              const response = await reqFetchPublicExchangeRates(getApiBaseUrl(), {
                sourceCurrency,
                sourceAmountMinor: parsedAmountMinor,
                amountUnit: sourceAmountUnit,
              });
              if (!response.ok) {
                setError(
                  response.error.message.trim() !== ''
                    ? response.error.message
                    : t('calculateFailed')
                );
                return;
              }
              if (response.data === undefined) {
                setError(t('calculateFailed'));
                return;
              }
              setData(response.data);
            } catch {
              setError(t('calculateFailed'));
            } finally {
              setLoading(false);
            }
          })();
        }}
      >
        <Stack>
          <Select
            label={t('currencyLabel')}
            options={currencyOptions}
            value={sourceCurrency}
            onChange={setSourceCurrency}
          />
          <Input
            label={t('amountMinorLabel')}
            type="number"
            min={0}
            step={1}
            value={sourceAmountMinor}
            onChange={setSourceAmountMinor}
            placeholder={t('amountMinorPlaceholder')}
            required
          />
          <Text size="sm" variant="muted">
            {t('amountUnitHint', {
              amountUnit:
                sourceAmountUnit !== ''
                  ? formatAmountUnitLabel(sourceAmountUnit)
                  : t('unknownAmountUnit'),
            })}
          </Text>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={sourceCurrency === '' || sourceAmountUnit === ''}
          >
            {t('calculate')}
          </Button>
        </Stack>
      </FormContainer>
      {error !== null && (
        <Text variant="error" role="alert">
          {error}
        </Text>
      )}
      {data === null ? (
        <Text variant="muted">{t('emptyState')}</Text>
      ) : (
        <Stack>
          <Text size="sm" variant="muted">
            {t('freshness', { timestamp: freshnessText ?? '—' })}
          </Text>
          <Table.ScrollContainer>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>{t('table.currency')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.amountMinor')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.amountUnit')}</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {data.conversions.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={3}>{t('emptyState')}</Table.Cell>
                  </Table.Row>
                ) : (
                  data.conversions.map((conversion) => (
                    <Table.Row key={conversion.currency}>
                      <Table.Cell>{buildCurrencyLabel(conversion.currency)}</Table.Cell>
                      <Table.Cell>{formatAmountMinor(conversion.amountMinor)}</Table.Cell>
                      <Table.Cell>{formatAmountUnitLabel(conversion.amountUnit)}</Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          </Table.ScrollContainer>
        </Stack>
      )}
    </Stack>
  );
}
