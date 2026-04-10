'use client';

import type { BreadcrumbItem, BreadcrumbsLinkComponentProps } from '@metaboost/ui';

import { Breadcrumbs, Link } from '@metaboost/ui';

function LinkAdapter({ href, children, className }: BreadcrumbsLinkComponentProps) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export type PublicBucketBreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function PublicBucketBreadcrumbs({ items }: PublicBucketBreadcrumbsProps) {
  if (items.length === 0) return null;
  return <Breadcrumbs items={items} LinkComponent={LinkAdapter} ariaLabel="Bucket breadcrumb" />;
}
