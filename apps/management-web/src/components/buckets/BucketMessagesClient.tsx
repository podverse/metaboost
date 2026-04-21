'use client';

import type { ManagementBucketMessage } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { managementWebBucketMessages } from '@metaboost/helpers-requests';
import { Button, ButtonLink, Stack, Text } from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';
import { bucketViewRoute } from '../../lib/routes';

import styles from './BucketMessagesClient.module.scss';

export type BucketMessagesClientProps = {
  bucketId: string;
  bucketName: string;
  initialMessages: ManagementBucketMessage[];
  canDelete: boolean;
};

export function BucketMessagesClient({
  bucketId,
  bucketName,
  initialMessages,
  canDelete,
}: BucketMessagesClientProps) {
  const router = useRouter();
  const t = useTranslations('common.bucketMessages');
  const apiBaseUrl = getManagementApiBaseUrl();

  const [messages, setMessages] = useState<ManagementBucketMessage[]>(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      {messages.length === 0 ? (
        <Text variant="muted">{t('noMessagesYet')}</Text>
      ) : (
        <ul className={styles.messageList}>
          {messages.map((m) => (
            <li key={m.id} className={styles.messageItem}>
              <div className={styles.senderName}>{m.senderName}</div>
              <div className={styles.meta}>{new Date(m.createdAt).toLocaleString()}</div>
              <div className={styles.body}>{m.body}</div>
              {canDelete && (
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    onClick={() => void handleDelete(m.id)}
                    loading={deletingId === m.id}
                  >
                    {t('delete')}
                  </Button>
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
