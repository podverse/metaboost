'use client';

import type { BreadcrumbItem, BucketMessageListItem } from '@boilerplate/ui';

import { useRouter } from 'next/navigation';

import { BucketMessagesPageContent } from '@boilerplate/ui';

import { getApiBaseUrl } from '../../../../../lib/api-client';
import { bucketMessageEditRoute } from '../../../../../lib/routes';

export type BucketMessagesPageClientProps = {
  bucketId: string;
  bucketName: string;
  bucketDetailHref: string;
  /** Parent buckets in hierarchy order (root first) for breadcrumbs. */
  ancestorItems?: BreadcrumbItem[];
  messages: BucketMessageListItem[];
  messagesTitle: string;
  messagesAriaLabel: string;
  emptyMessage: string;
  /** When set (recursive routes), edit link is `${messageEditRoutePrefix}/${messageId}/edit`. */
  messageEditRoutePrefix?: string;
};

export function BucketMessagesPageClient({
  bucketId,
  bucketName,
  bucketDetailHref,
  ancestorItems = [],
  messages,
  messagesTitle,
  messagesAriaLabel,
  emptyMessage,
  messageEditRoutePrefix,
}: BucketMessagesPageClientProps) {
  const router = useRouter();

  const handleDelete = async (messageId: string): Promise<void> => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/buckets/${bucketId}/messages/${messageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      router.refresh();
    }
  };

  const getEditHref =
    messageEditRoutePrefix !== undefined && messageEditRoutePrefix !== ''
      ? (messageId: string) => `${messageEditRoutePrefix}/${messageId}/edit`
      : (messageId: string) => bucketMessageEditRoute(bucketId, messageId);

  return (
    <BucketMessagesPageContent
      ancestorItems={ancestorItems}
      bucketName={bucketName}
      bucketDetailHref={bucketDetailHref}
      messagesAriaLabel={messagesAriaLabel}
      messagesTitle={messagesTitle}
      messages={messages}
      bucketId={bucketId}
      emptyMessage={emptyMessage}
      onDelete={handleDelete}
      getEditHref={getEditHref}
    />
  );
}
