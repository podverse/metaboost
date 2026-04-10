'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { managementWebBucketMessages } from '@boilerplate/helpers-requests';
import {
  Button,
  ButtonLink,
  CheckboxField,
  FormActions,
  FormContainer,
  Input,
  Stack,
  Text,
} from '@boilerplate/ui';

import { getManagementApiBaseUrl } from '../../config/env';

export type BucketMessageEditClientProps = {
  bucketId: string;
  messageId: string;
  initialBody: string;
  initialIsPublic: boolean;
  senderName: string;
  messagesRoute: string;
};

export function BucketMessageEditClient({
  bucketId,
  messageId,
  initialBody,
  initialIsPublic,
  senderName,
  messagesRoute,
}: BucketMessageEditClientProps) {
  const router = useRouter();
  const t = useTranslations('common.bucketMessages');
  const apiBaseUrl = getManagementApiBaseUrl();

  const [body, setBody] = useState(initialBody);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [bodyTouched, setBodyTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const bodyError = bodyTouched && body.trim() === '' ? t('bodyRequired') : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBodyTouched(true);
    if (body.trim() === '') return;
    setSubmitError(null);
    setLoading(true);
    try {
      const res = await managementWebBucketMessages.updateBucketMessage(
        apiBaseUrl,
        bucketId,
        messageId,
        { body: body.trim(), isPublic }
      );
      if (!res.ok) {
        setSubmitError(res.error.message ?? 'Failed to update message');
        return;
      }
      router.push(messagesRoute);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack>
      <Text variant="muted">From: {senderName}</Text>
      <FormContainer
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
      >
        <Stack>
          <Input
            label={t('body')}
            value={body}
            onChange={setBody}
            onBlur={() => setBodyTouched(true)}
            error={bodyError ?? undefined}
            autoComplete="off"
          />
          <CheckboxField label={t('isPublic')} checked={isPublic} onChange={setIsPublic} />
          {submitError !== null && (
            <Text variant="error" role="alert">
              {submitError}
            </Text>
          )}
          <FormActions>
            <ButtonLink href={messagesRoute} variant="secondary">
              {t('cancel')}
            </ButtonLink>
            <Button type="submit" variant="primary" loading={loading}>
              {t('saveChanges')}
            </Button>
          </FormActions>
        </Stack>
      </FormContainer>
    </Stack>
  );
}
