'use client';

import type { BreadcrumbItem, BucketMessageListItem } from '@metaboost/ui';

import { useRouter } from 'next/navigation';

import { managementWebBucketMessages } from '@metaboost/helpers-requests';
import { BucketMessagesPageContent } from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../../../../config/env';

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
}: BucketMessagesPageClientProps) {
  const router = useRouter();
  const apiBaseUrl = getManagementApiBaseUrl();

  const handleDelete = async (messageId: string): Promise<void> => {
    const res = await managementWebBucketMessages.deleteBucketMessage(
      apiBaseUrl,
      bucketId,
      messageId
    );
    if (res.ok) {
      router.refresh();
    }
  };

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
    />
  );
}
