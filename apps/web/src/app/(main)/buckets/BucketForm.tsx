'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Button,
  ButtonLink,
  CheckboxField,
  FormActions,
  FormContainer,
  InfoIcon,
  Input,
  Row,
  Stack,
  Text,
  Tooltip,
} from '@boilerplate/ui';

import { getApiBaseUrl } from '../../../lib/api-client';

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
  const [name, setName] = useState(bucket?.name ?? '');
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
    if (!name.trim()) {
      setSubmitError(t('name') + ' is required.');
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
        const res = await fetch(`${baseUrl}/buckets`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSubmitError(
            typeof data?.message === 'string' ? data.message : 'Failed to create bucket'
          );
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
        <Input
          label={t('name')}
          type="text"
          value={name}
          onChange={setName}
          disabled={loading}
          required
        />
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
