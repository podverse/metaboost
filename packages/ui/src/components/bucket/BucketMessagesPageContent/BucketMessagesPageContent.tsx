'use client';

import type { BreadcrumbItem } from '../../navigation/Breadcrumbs/index';
import type { BucketMessageListItem } from '../BucketMessageList/index';

import { ContentPageLayout } from '../../layout/ContentPageLayout/index';
import { BucketMessageList } from '../BucketMessageList/index';
import { BucketMessagesBreadcrumbs } from '../BucketMessagesBreadcrumbs/index';

/**
 * Shared bucket messages page content for web and management-web.
 * Renders breadcrumbs + title + message list only. No "Add message" — that is only on the public bucket page.
 */
export type BucketMessagesPageContentProps = {
  /** Optional segments before ancestry in breadcrumbs (e.g. Dashboard). */
  leadingBreadcrumbItems?: BreadcrumbItem[];
  /** Optional parent buckets in hierarchy order (root first) for breadcrumbs. */
  ancestorItems?: BreadcrumbItem[];
  bucketName: string;
  bucketDetailHref: string;
  messagesAriaLabel: string;
  messagesTitle: string;
  messages: BucketMessageListItem[];
  bucketId: string;
  emptyMessage: string;
  onDelete?: (messageId: string) => void | Promise<void>;
};

export function BucketMessagesPageContent({
  leadingBreadcrumbItems = [],
  ancestorItems = [],
  bucketName,
  bucketDetailHref,
  messagesAriaLabel,
  messagesTitle,
  messages,
  bucketId,
  emptyMessage,
  onDelete,
}: BucketMessagesPageContentProps) {
  return (
    <ContentPageLayout
      breadcrumbs={
        <BucketMessagesBreadcrumbs
          leadingItems={leadingBreadcrumbItems}
          ancestorItems={ancestorItems}
          bucketName={bucketName}
          bucketDetailHref={bucketDetailHref}
          currentPageLabel={messagesTitle}
          messagesAriaLabel={messagesAriaLabel}
        />
      }
      title={messagesTitle}
      contentMaxWidth="readable"
    >
      <BucketMessageList
        messages={messages}
        variant="management"
        bucketId={bucketId}
        emptyMessage={emptyMessage}
        onDelete={onDelete}
      />
    </ContentPageLayout>
  );
}
