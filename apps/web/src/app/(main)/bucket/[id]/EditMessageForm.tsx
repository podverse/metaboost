'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH } from '@metaboost/helpers';
import {
  Button,
  ButtonLink,
  CheckboxField,
  FormActions,
  FormContainer,
  InfoIcon,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@metaboost/ui';

import { getApiBaseUrl } from '../../../../lib/api-client';

import styles from './EditMessageForm.module.scss';

export function EditMessageForm({
  bucketId,
  messageId,
  initialBody,
  initialIsPublic,
  messageBodyMaxLength,
  successHref,
  cancelHref,
}: {
  bucketId: string;
  messageId: string;
  initialBody: string;
  initialIsPublic: boolean;
  messageBodyMaxLength: number | null;
  successHref: string;
  cancelHref: string;
}) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maxLen = messageBodyMaxLength ?? undefined;
  const overLimit = maxLen !== undefined && maxLen !== null ? body.length > maxLen : false;
  const canSubmit = !loading && body.trim().length > 0 && !overLimit;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (!body.trim()) {
      setSubmitError('Message body is required.');
      return;
    }
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/buckets/${bucketId}/messages/${messageId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), isPublic }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(
          typeof data?.message === 'string' ? data.message : 'Failed to update message'
        );
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
        <Textarea
          label={t('bodyLabel')}
          value={body}
          onChange={setBody}
          disabled={loading}
          rows={4}
          maxLength={maxLen ?? undefined}
          displayMaxLength={messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH}
          charCountLabel={(current, max) => t('charCount', { current, max })}
          showCharCount
          charCountLabelNoMax={(current) => t('charCountNoMax', { current })}
        />
        <div className={styles.checkboxRow}>
          <CheckboxField
            label={t('isPublic')}
            checked={isPublic}
            onChange={setIsPublic}
            disabled={loading}
          />
          <Tooltip content={t('messagePublicTooltip')}>
            <InfoIcon size={18} />
          </Tooltip>
        </div>
        {submitError !== null && (
          <Text variant="error" size="sm" as="p" role="alert">
            {submitError}
          </Text>
        )}
        <FormActions>
          <ButtonLink href={cancelHref} variant="secondary">
            {t('cancel')}
          </ButtonLink>
          <Button type="submit" variant="primary" loading={loading} disabled={!canSubmit}>
            {t('save')}
          </Button>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
