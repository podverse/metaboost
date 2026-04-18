'use client';

import type { MbBucketType } from '@metaboost/helpers-requests';

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

import { getApiBaseUrl } from '../../../lib/api-client';
import { bucketDetailTabRoute } from '../../../lib/routes';

type MbChildFormProps = {
  parentBucketId: string;
  parentType: Exclude<MbBucketType, 'mb-leaf'>;
  cancelHref: string;
};

export function MbChildForm({ parentBucketId, parentType, cancelHref }: MbChildFormProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const childType = parentType === 'mb-root' ? 'mb-mid' : 'mb-leaf';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (name.trim() === '') {
      setSubmitError(t('name') + ' is required.');
      return;
    }
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const body =
      childType === 'mb-mid'
        ? { type: 'mb-mid' as const, name: name.trim(), isPublic }
        : { type: 'mb-leaf' as const, name: name.trim(), isPublic };

    try {
      const res = await webBuckets.reqPostCreateChildBucket(baseUrl, parentBucketId, body);
      if (!res.ok) {
        setSubmitError(res.error.message || 'Failed to create bucket');
        return;
      }
      const createdBucket = res.data?.bucket;
      if (createdBucket === undefined) {
        setSubmitError('Failed to create bucket');
        return;
      }
      router.push(bucketDetailTabRoute(createdBucket.shortId, 'endpoint'));
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
          {parentType === 'mb-root'
            ? t('bucketTypeMbMidDescription')
            : t('bucketTypeMbLeafDescription')}
        </Text>
        <Input
          label={t('name')}
          type="text"
          value={name}
          onChange={setName}
          disabled={loading}
          required
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
