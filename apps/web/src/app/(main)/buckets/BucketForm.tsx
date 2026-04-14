'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { webBuckets } from '@metaboost/helpers-requests';
import {
  Button,
  ButtonLink,
  CheckboxField,
  FormActions,
  FormContainer,
  InfoIcon,
  Input,
  OptionTileSelector,
  Row,
  Stack,
  Text,
  Tooltip,
} from '@metaboost/ui';

import { getApiBaseUrl } from '../../../lib/api-client';
import { bucketDetailTabRoute } from '../../../lib/routes';

export type BucketForForm = {
  id: string;
  name: string;
  isPublic: boolean;
  messageBodyMaxLength: number | null;
};

type BucketFormProps = {
  mode: 'create' | 'edit';
  bucket: BucketForForm | null;
  successHref: string;
  cancelHref: string;
};

export function BucketForm({ mode, bucket, successHref, cancelHref }: BucketFormProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [createType, setCreateType] = useState<'rss-network' | 'rss-channel'>('rss-channel');
  const [name, setName] = useState(bucket?.name ?? '');
  const [rssFeedUrl, setRssFeedUrl] = useState('');
  const [isPublic, setIsPublic] = useState(bucket?.isPublic ?? true);
  const [messageBodyMaxLength, setMessageBodyMaxLength] = useState<string>(
    bucket?.messageBodyMaxLength !== undefined && bucket?.messageBodyMaxLength !== null
      ? String(bucket.messageBodyMaxLength)
      : ''
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (mode === 'create' && createType === 'rss-network' && !name.trim()) {
      setSubmitError(t('name') + ' is required.');
      return;
    }
    if (mode === 'edit' && !name.trim()) {
      setSubmitError(t('name') + ' is required.');
      return;
    }
    if (mode === 'create' && createType === 'rss-channel' && rssFeedUrl.trim() === '') {
      setSubmitError(t('rssFeedUrl') + ' is required.');
      return;
    }
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const body: { name: string; isPublic: boolean; messageBodyMaxLength?: number | null } = {
      name: name.trim(),
      isPublic,
    };
    if (mode === 'edit') {
      body.messageBodyMaxLength =
        messageBodyMaxLength.trim() === ''
          ? null
          : Math.max(1, Math.floor(Number(messageBodyMaxLength))) || null;
    }

    try {
      if (mode === 'create') {
        let createBody: webBuckets.CreateBucketBody;
        if (createType === 'rss-network') {
          createBody = { type: 'rss-network', name: name.trim(), isPublic };
        } else {
          createBody = { type: 'rss-channel', rssFeedUrl: rssFeedUrl.trim(), isPublic };
        }
        const res = await webBuckets.reqPostCreateBucket(baseUrl, createBody);
        if (!res.ok) {
          setSubmitError(res.error.message || 'Failed to create bucket');
          return;
        }
        if (res.data?.bucket === undefined) {
          setSubmitError('Failed to create bucket');
          return;
        }
        const created = res.data.bucket;
        if (createType === 'rss-channel') {
          router.push(bucketDetailTabRoute(created.shortId, 'add-to-rss'));
          return;
        }
      } else if (bucket !== null) {
        const res = await fetch(`${baseUrl}/buckets/${bucket.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSubmitError(
            typeof data?.message === 'string' ? data.message : 'Failed to update bucket'
          );
          return;
        }
      }
      router.push(successHref);
    } catch {
      setSubmitError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Stack>
        {mode === 'create' && (
          <OptionTileSelector
            label={t('bucketTypeLabel')}
            options={[
              {
                value: 'rss-channel',
                label: t('bucketTypeRssChannel'),
                iconClassName: 'fa-solid fa-rss',
              },
              {
                value: 'rss-network',
                label: t('bucketTypeRssNetwork'),
                iconClassName: 'fa-solid fa-diagram-project',
              },
            ]}
            value={createType}
            onChange={(value) => {
              const nextType = value === 'rss-channel' ? 'rss-channel' : 'rss-network';
              setCreateType(nextType);
              setSubmitError(null);
            }}
            disabled={loading}
          />
        )}
        {mode === 'create' && createType === 'rss-network' && (
          <>
            <Text as="p" size="sm">
              {t('bucketTypeRssNetworkDescription')}
            </Text>
            <Input
              label={t('name')}
              type="text"
              value={name}
              onChange={setName}
              disabled={loading}
              required
            />
          </>
        )}
        {mode === 'create' && createType === 'rss-channel' && (
          <>
            <Text as="p" size="sm">
              {t('bucketTypeRssChannelDescription')}
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
          </>
        )}
        {mode === 'edit' && (
          <Input
            label={t('name')}
            type="text"
            value={name}
            onChange={setName}
            disabled={loading}
            required
          />
        )}
        {mode === 'edit' && (
          <Input
            label={t('messageBodyMaxLengthLabel')}
            type="number"
            min={1}
            value={messageBodyMaxLength}
            onChange={setMessageBodyMaxLength}
            disabled={loading}
            placeholder={t('messageBodyMaxLengthPlaceholder')}
          />
        )}
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
          <Button type="submit" variant="primary" loading={loading}>
            {mode === 'create' ? t('addBucket') : t('save')}
          </Button>
          <ButtonLink href={cancelHref} variant="secondary">
            {t('cancel')}
          </ButtonLink>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
