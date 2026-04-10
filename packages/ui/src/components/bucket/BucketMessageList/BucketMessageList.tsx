'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { CrudButtons, MessageCard, Row, Stack, Text } from '@boilerplate/ui';

import styles from './BucketMessageList.module.scss';

export type BucketMessageListItem = {
  id: string;
  senderName: string;
  body: string;
  isPublic: boolean;
  createdAt: string;
  bucketId?: string;
};

export type BucketMessageListProps = {
  messages: BucketMessageListItem[];
  variant: 'management' | 'public';
  bucketId?: string;
  emptyMessage?: string;
  /** When provided, called on delete; parent may refetch so messages sync via initialMessages. */
  onDelete?: (messageId: string) => void | Promise<void>;
  /** When provided (management variant), used to build edit href. Else default /buckets/{bucketId}/messages/{id}/edit. */
  getEditHref?: (messageId: string) => string;
};

export function BucketMessageList({
  messages: initialMessages,
  variant,
  bucketId,
  emptyMessage,
  onDelete,
  getEditHref,
}: BucketMessageListProps) {
  const t = useTranslations('buckets');
  const [messages, setMessages] = useState<BucketMessageListItem[]>(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const showActions = variant === 'management' && bucketId !== undefined;
  const editHrefFn =
    getEditHref ??
    (showActions
      ? (messageId: string) => `/buckets/${bucketId}/messages/${messageId}/edit`
      : undefined);

  const handleDelete = async (messageId: string): Promise<void> => {
    if (onDelete !== undefined) {
      await onDelete(messageId);
      return;
    }
    if (!confirm(t('delete') + ' this message?')) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const empty =
    emptyMessage ?? (variant === 'public' ? 'No public messages yet.' : 'No messages yet.');

  if (messages.length === 0) {
    return <Text variant="muted">{empty}</Text>;
  }

  return (
    <Stack>
      {messages.map((m) => (
        <Row key={m.id} className={styles.messageRow}>
          <MessageCard
            senderName={m.senderName}
            createdAt={m.createdAt}
            body={m.body}
            showPublicPrivate={variant === 'management'}
            isPublic={m.isPublic}
            bodyVariant="full"
            className={styles.messageCardWrap}
          />
          {showActions && editHrefFn !== undefined && (
            <div className={styles.actions}>
              <CrudButtons
                editHref={editHrefFn(m.id)}
                editLabel={t('edit')}
                onDelete={() => void handleDelete(m.id)}
                deleteLabel={t('delete')}
              />
            </div>
          )}
        </Row>
      ))}
    </Stack>
  );
}
