'use client';

import type { ManagementBucketMessage } from '@boilerplate/helpers-requests';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
import { bucketMessageEditRoute, bucketViewRoute } from '../../lib/routes';

import styles from './BucketMessagesClient.module.scss';

export type BucketMessagesClientProps = {
  bucketId: string;
  bucketName: string;
  initialMessages: ManagementBucketMessage[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function BucketMessagesClient({
  bucketId,
  bucketName,
  initialMessages,
  canCreate,
  canUpdate,
  canDelete,
}: BucketMessagesClientProps) {
  const router = useRouter();
  const t = useTranslations('common.bucketMessages');
  const apiBaseUrl = getManagementApiBaseUrl();

  const [messages, setMessages] = useState<ManagementBucketMessage[]>(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [senderNameTouched, setSenderNameTouched] = useState(false);
  const [bodyTouched, setBodyTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const senderNameError =
    senderNameTouched && senderName.trim() === '' ? t('senderNameRequired') : null;
  const bodyError = bodyTouched && body.trim() === '' ? t('bodyRequired') : null;

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSenderNameTouched(true);
    setBodyTouched(true);
    if (senderName.trim() === '' || body.trim() === '') return;
    setSubmitError(null);
    setLoading(true);
    try {
      const res = await managementWebBucketMessages.createBucketMessage(apiBaseUrl, bucketId, {
        senderName: senderName.trim(),
        body: body.trim(),
        isPublic,
      });
      if (!res.ok) {
        setSubmitError(res.error.message ?? t('createFailed'));
        return;
      }
      const newMessage = res.data?.message;
      if (newMessage !== undefined) {
        setMessages((prev) => [...prev, newMessage]);
      }
      setShowAddForm(false);
      setSenderName('');
      setBody('');
      setSenderNameTouched(false);
      setBodyTouched(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!canDelete || !confirm(t('delete') + '?')) return;
    setDeletingId(messageId);
    try {
      const res = await managementWebBucketMessages.deleteBucketMessage(
        apiBaseUrl,
        bucketId,
        messageId
      );
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Stack>
      {canCreate && (
        <>
          {!showAddForm ? (
            <Button variant="primary" onClick={() => setShowAddForm(true)}>
              {t('addMessage')}
            </Button>
          ) : (
            <FormContainer
              onSubmit={(e) => {
                void handleCreateSubmit(e);
              }}
            >
              <Stack>
                <Input
                  label={t('senderName')}
                  value={senderName}
                  onChange={setSenderName}
                  onBlur={() => setSenderNameTouched(true)}
                  error={senderNameError ?? undefined}
                  autoComplete="off"
                />
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
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setSubmitError(null);
                    }}
                    disabled={loading}
                  >
                    {t('cancel')}
                  </Button>
                  <Button type="submit" variant="primary" loading={loading}>
                    {t('createMessage')}
                  </Button>
                </FormActions>
              </Stack>
            </FormContainer>
          )}
        </>
      )}

      {messages.length === 0 ? (
        <Text variant="muted">{t('noMessagesYet')}</Text>
      ) : (
        <ul className={styles.messageList}>
          {messages.map((m) => (
            <li key={m.id} className={styles.messageItem}>
              <div className={styles.senderName}>{m.senderName}</div>
              <div className={styles.meta}>
                {new Date(m.createdAt).toLocaleString()}
                {m.isPublic ? ' · Public' : ' · Private'}
              </div>
              <div className={styles.body}>{m.body}</div>
              {(canUpdate || canDelete) && (
                <div className={styles.actions}>
                  {canUpdate && (
                    <ButtonLink href={bucketMessageEditRoute(bucketId, m.id)} variant="secondary">
                      {t('edit')}
                    </ButtonLink>
                  )}
                  {canDelete && (
                    <Button
                      variant="secondary"
                      onClick={() => void handleDelete(m.id)}
                      loading={deletingId === m.id}
                    >
                      {t('delete')}
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ButtonLink href={bucketViewRoute(bucketId)} variant="secondary">
        ← {bucketName}
      </ButtonLink>
    </Stack>
  );
}
