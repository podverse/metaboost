'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { isNonNegativeInteger } from '@metaboost/helpers';
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

const FALLBACK_SUPPORTED_CURRENCIES = [
  'USD',
  'BTC',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'CHF',
  'NZD',
  'SEK',
  'NOK',
  'DKK',
  'INR',
  'BRL',
  'MXN',
  'ZAR',
  'SGD',
  'HKD',
  'KRW',
];

const FALLBACK_CURRENCY_UNITS: Record<string, string> = {
  USD: 'cent',
  BTC: 'satoshi',
  EUR: 'cent',
  GBP: 'pence',
  CAD: 'cent',
  AUD: 'cent',
  JPY: 'yen',
  CHF: 'rappen',
  NZD: 'cent',
  SEK: 'ore',
  NOK: 'ore',
  DKK: 'ore',
  INR: 'paise',
  BRL: 'centavo',
  MXN: 'centavo',
  ZAR: 'cent',
  SGD: 'cent',
  HKD: 'cent',
  KRW: 'won',
};

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
  const locale = useLocale();
  const [data, setData] = useState<PublicExchangeRatesConversion | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [sourceCurrency, setSourceCurrency] = useState<string>(
    initialData?.source.currency ?? 'USD'
  );
  const [sourceAmountMinor, setSourceAmountMinor] = useState<string>(
    initialData?.source.amountMinor !== undefined ? String(initialData.source.amountMinor) : '100'
  );

  const supportedCurrenciesFromApi = data?.metadata.supportedCurrencies ?? [];
  const supportedCurrencies =
    supportedCurrenciesFromApi.length > 0
      ? supportedCurrenciesFromApi
      : FALLBACK_SUPPORTED_CURRENCIES;
  const currencyUnitsFromApi = data?.metadata.currencyUnits ?? {};
  const currencyUnits =
    Object.keys(currencyUnitsFromApi).length > 0 ? currencyUnitsFromApi : FALLBACK_CURRENCY_UNITS;
  const sourceAmountUnit = currencyUnits[sourceCurrency] ?? '';
  const currencyOptions = useMemo(
    () =>
      supportedCurrencies.map((currencyCode) => ({
        value: currencyCode,
        label: buildCurrencyLabel(currencyCode),
      })),
    [supportedCurrencies]
  );
  const freshnessText =
    data !== null ? formatDateTimeReadable(locale, data.metadata.exchangeRatesFetchedAt) : null;

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
              amountUnit: sourceAmountUnit !== '' ? sourceAmountUnit : t('unknownAmountUnit'),
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
                      <Table.Cell>{String(conversion.amountMinor)}</Table.Cell>
                      <Table.Cell>{conversion.amountUnit}</Table.Cell>
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
