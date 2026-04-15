'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { CrudButtons, MessageCard, Row, Stack, Text } from '@metaboost/ui';

import styles from './BucketMessageList.module.scss';

export type BucketMessageListItem = {
  id: string;
  senderName: string | null;
  body: string;
  isPublic: boolean;
  createdAt: string;
  bucketId?: string;
  amountLine?: string | null;
  appName?: string | null;
  detailsSections?: Array<{
    title: string;
    items: Array<{ label: string; value: string }>;
  }>;
  detailsOpenLabel?: string;
  detailsCloseLabel?: string;
  miniBreadcrumbItems?: Array<{ label: string; href: string }>;
  verificationStatus?: {
    iconClassName: string;
    label: string;
    tone: 'success' | 'info' | 'warning' | 'danger';
  };
};

export type BucketMessageListProps = {
  messages: BucketMessageListItem[];
  variant: 'management' | 'public';
  bucketId?: string;
  emptyMessage?: string;
  /** When provided, called on delete; parent may refetch so messages sync via initialMessages. */
  onDelete?: (messageId: string) => void | Promise<void>;
};

export function BucketMessageList({
  messages: initialMessages,
  variant,
  bucketId,
  emptyMessage,
  onDelete,
}: BucketMessageListProps) {
  const t = useTranslations('buckets');
  const [messages, setMessages] = useState<BucketMessageListItem[]>(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const showActions = variant === 'management' && bucketId !== undefined;
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
            amountLine={m.amountLine}
            appName={m.appName}
            showPublicPrivate={variant === 'management'}
            isPublic={m.isPublic}
            bodyVariant="full"
            verificationStatus={m.verificationStatus}
            detailsSections={m.detailsSections}
            detailsOpenLabel={m.detailsOpenLabel}
            detailsCloseLabel={m.detailsCloseLabel}
            miniBreadcrumbItems={m.miniBreadcrumbItems}
            className={styles.messageCardWrap}
          />
          {showActions && onDelete !== undefined && (
            <div className={styles.actions}>
              <CrudButtons onDelete={() => void handleDelete(m.id)} deleteLabel={t('delete')} />
            </div>
          )}
        </Row>
      ))}
    </Stack>
  );
}
