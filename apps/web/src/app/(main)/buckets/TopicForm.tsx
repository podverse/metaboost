'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Button,
  Input,
  FormActions,
  FormContainer,
  CheckboxField,
  InfoIcon,
  Link,
  Row,
  Stack,
  Text,
  Tooltip,
} from '@metaboost/ui';

import { getApiBaseUrl } from '../../../lib/api-client';

type TopicFormProps = {
  parentBucketId: string;
  successHref: string;
  cancelHref: string;
};

export function TopicForm({ parentBucketId, successHref, cancelHref }: TopicFormProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (!name.trim()) {
      setSubmitError(t('name') + ' is required.');
      return;
    }
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const body = {
      name: name.trim(),
      isPublic,
    };

    try {
      const res = await fetch(`${baseUrl}/buckets/${parentBucketId}/buckets`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(typeof data?.message === 'string' ? data.message : 'Failed to create topic');
        return;
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
