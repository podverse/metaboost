'use client';

import type { BreadcrumbItem } from '@boilerplate/ui';

import { Breadcrumbs, Link } from '@boilerplate/ui';

export type BucketMessagesBreadcrumbsProps = {
  /** Optional parent buckets in hierarchy order (root first). When set, shown before the current bucket. */
  ancestorItems?: BreadcrumbItem[];
  bucketName: string;
  bucketDetailHref: string;
  /** Title of the current page (last breadcrumb, text only). */
  currentPageLabel: string;
  messagesAriaLabel: string;
};

function LinkAdapter({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function BucketMessagesBreadcrumbs({
  ancestorItems = [],
  bucketName,
  bucketDetailHref,
  currentPageLabel,
  messagesAriaLabel,
}: BucketMessagesBreadcrumbsProps) {
  const items: BreadcrumbItem[] = [
    ...ancestorItems,
    { label: bucketName, href: bucketDetailHref },
    { label: currentPageLabel, href: undefined },
  ];
  return <Breadcrumbs items={items} LinkComponent={LinkAdapter} ariaLabel={messagesAriaLabel} />;
}
