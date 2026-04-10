'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH } from '@boilerplate/helpers';
import { webBuckets } from '@boilerplate/helpers-requests';
import {
  Button,
  CheckboxField,
  FormActions,
  FormContainer,
  InfoIcon,
  Input,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@boilerplate/ui';

import { getApiBaseUrl } from '../../../lib/api-client';

import styles from './PublicSubmitForm.module.scss';

export function PublicSubmitForm({
  bucketId,
  messageBodyMaxLength,
  successHref,
}: {
  bucketId: string;
  messageBodyMaxLength: number | null;
  successHref: string;
}) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [senderName, setSenderName] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maxLen = messageBodyMaxLength ?? undefined;
  const overLimit = maxLen !== undefined && maxLen !== null ? body.length > maxLen : false;
  const canSubmit =
    !loading && senderName.trim().length > 0 && body.trim().length > 0 && !overLimit;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (!senderName.trim()) {
      setSubmitError('Your name is required.');
      return;
    }
    if (!body.trim()) {
      setSubmitError('Message body is required.');
      return;
    }
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    try {
      const res = await webBuckets.reqPostPublicBucketMessage(baseUrl, bucketId, {
        senderName: senderName.trim(),
        body: body.trim(),
        isPublic,
      });
      if (!res.ok) {
        setSubmitError(res.error.message ?? 'Failed to submit message');
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
          label={t('yourName')}
          type="text"
          value={senderName}
          onChange={setSenderName}
          disabled={loading}
          required
        />
        <Textarea
          label={t('messageLabel')}
          value={body}
          onChange={setBody}
          disabled={loading}
          rows={4}
          required
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
          <Button type="submit" variant="primary" loading={loading} disabled={!canSubmit}>
            {t('submit')}
          </Button>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
