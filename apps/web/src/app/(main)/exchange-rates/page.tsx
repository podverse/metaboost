import type { PublicExchangeRatesConversion } from '../../../lib/exchangeRates';

import { getTranslations } from 'next-intl/server';

import { ContentPageLayout } from '@metaboost/ui';

import { reqFetchPublicExchangeRates } from '../../../lib/exchangeRates';
import { getServerApiBaseUrl } from '../../../lib/server-request';
import { ExchangeRatesPageClient } from './ExchangeRatesPageClient';

const DEFAULT_SOURCE_CURRENCY = 'USD';
const DEFAULT_SOURCE_AMOUNT_MINOR = 100;
const DEFAULT_SOURCE_AMOUNT_UNIT = 'cent';

export default async function ExchangeRatesPage() {
  const t = await getTranslations('exchangeRatesPage');
  const baseUrl = getServerApiBaseUrl();
  const response = await reqFetchPublicExchangeRates(baseUrl, {
    sourceCurrency: DEFAULT_SOURCE_CURRENCY,
    sourceAmountMinor: DEFAULT_SOURCE_AMOUNT_MINOR,
    amountUnit: DEFAULT_SOURCE_AMOUNT_UNIT,
  });
  const initialData: PublicExchangeRatesConversion | null =
    response.ok && response.data !== undefined ? response.data : null;
  const initialError =
    !response.ok && response.error.message.trim() !== '' ? response.error.message : null;

  return (
    <ContentPageLayout title={t('title')} contentMaxWidth="readable">
      <ExchangeRatesPageClient initialData={initialData} initialError={initialError} />
    </ContentPageLayout>
  );
}
