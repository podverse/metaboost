'use client';

import { useTranslations } from 'next-intl';

import { CodeSnippetBox, Link, Stack, Text } from '@metaboost/ui';

import { getMbV1BoostPublicUrl, getMbV1OpenApiSpecUrl } from '../../../../config/env';

type EndpointPanelProps = {
  bucketIdText: string;
};

export function EndpointPanel({ bucketIdText }: EndpointPanelProps) {
  const t = useTranslations('buckets');
  const boostUrl = getMbV1BoostPublicUrl(bucketIdText);
  const openApiUrl = getMbV1OpenApiSpecUrl();

  return (
    <Stack>
      <Text as="p" size="sm">
        {t('endpointTabDescription')}
      </Text>
      <Text as="p" size="sm">
        {t('endpointPostUrlLabel')}
      </Text>
      <CodeSnippetBox value={boostUrl} copyLabel={t('copySnippet')} />
      <Text as="p" size="sm">
        {t('endpointOpenApiIntro')}{' '}
        <Link href={openApiUrl} target="_blank" rel="noopener noreferrer">
          {t('mbV1OpenApiLink')}
        </Link>
      </Text>
    </Stack>
  );
}
