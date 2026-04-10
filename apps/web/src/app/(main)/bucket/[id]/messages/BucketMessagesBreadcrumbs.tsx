'use client';

import type { BreadcrumbItem } from '@metaboost/ui';

import { useTranslations } from 'next-intl';

import { Breadcrumbs, Link } from '@metaboost/ui';

import { bucketDetailRoute } from '../../../../../lib/routes';

type BucketMessagesBreadcrumbsProps = {
  bucketId: string;
  bucketName: string;
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
  bucketId,
  bucketName,
}: BucketMessagesBreadcrumbsProps) {
  const t = useTranslations('buckets');

  const items: BreadcrumbItem[] = [
    { label: bucketName, href: bucketDetailRoute(bucketId) },
    { label: t('messages'), href: undefined },
  ];

  return <Breadcrumbs items={items} LinkComponent={LinkAdapter} ariaLabel={t('messages')} />;
}
