'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { webBuckets } from '@metaboost/helpers-requests';
import {
  Button,
  CheckboxField,
  FormActions,
  FormContainer,
  InfoIcon,
  Input,
  Link,
  Row,
  Stack,
  Text,
  Tooltip,
} from '@metaboost/ui';

import { getWebBrandName } from '../../../config/env';
import { getApiBaseUrl } from '../../../lib/api-client';
import { bucketDetailRoute } from '../../../lib/routes';

type RssChannelFormProps = {
  parentBucketId: string;
  cancelHref: string;
};

export function RssChannelForm({ parentBucketId, cancelHref }: RssChannelFormProps) {
  const t = useTranslations('buckets');
  const brandName = getWebBrandName() ?? 'metaboost-web';
  const router = useRouter();
  const [rssFeedUrl, setRssFeedUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (rssFeedUrl.trim() === '') {
      setSubmitError(t('rssFeedUrl') + ' is required.');
      return;
    }
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const body = { type: 'rss-channel' as const, rssFeedUrl: rssFeedUrl.trim(), isPublic };

    try {
      const res = await webBuckets.reqPostCreateChildBucket(baseUrl, parentBucketId, body);
      if (!res.ok) {
        setSubmitError(res.error.message || 'Failed to create RSS channel');
        return;
      }
      const createdBucket = res.data?.bucket;
      if (createdBucket === undefined) {
        setSubmitError('Failed to create RSS channel');
        return;
      }
      const path = bucketDetailRoute(createdBucket.shortId);
      router.push(`${path}?tab=add-to-rss`);
    } catch {
      setSubmitError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Stack>
        <Text as="p" size="sm">
          {t('bucketTypeRssChannelDescription', { brand_name: brandName })}
        </Text>
        <Input
          label={t('rssFeedUrl')}
          type="url"
          value={rssFeedUrl}
          onChange={setRssFeedUrl}
          disabled={loading}
          required
          placeholder={t('rssFeedUrlPlaceholder')}
        />
        <Row>
          <CheckboxField
            label={t('isPublic')}
            checked={isPublic}
            onChange={setIsPublic}
            disabled={loading}
          />
          <Tooltip content={t('publicTooltip')}>
            <InfoIcon size={18} />
          </Tooltip>
        </Row>
        {submitError !== null && (
          <Text variant="error" size="sm" as="p" role="alert">
            {submitError}
          </Text>
        )}
        <FormActions>
          <Link href={cancelHref}>
            <Button type="button" variant="secondary" disabled={loading}>
              {t('cancel')}
            </Button>
          </Link>
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            {t('addBucket')}
          </Button>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
