import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { canViewBucketSettings } from '../../../../../lib/bucket-authz';
import { fetchBucket, fetchBucketAncestry } from '../../../../../lib/buckets';
import { ROUTES, bucketDetailRoute } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';
import { BucketSettingsLayoutClient } from './BucketSettingsLayoutClient';

export default async function BucketSettingsLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const { id } = await params;
  const { bucket } = await fetchBucket(id);
  if (bucket === null) {
    notFound();
  }
  const canAccessSettings = await canViewBucketSettings(bucket.id, bucket.ownerId, user);
  if (!canAccessSettings) {
    notFound();
  }

  const [t, ancestors] = await Promise.all([
    getTranslations('buckets'),
    fetchBucketAncestry(bucket),
  ]);
  const ancestorItems: BreadcrumbItem[] = ancestors.map((a) => ({
    label: a.name,
    href: bucketDetailRoute(a.idText),
  }));

  return (
    <BucketSettingsLayoutClient
      bucketId={id}
      bucketName={bucket.name}
      bucketSettingsTitle={t('bucketSettings')}
      ancestorItems={ancestorItems}
    >
      {children}
    </BucketSettingsLayoutClient>
  );
}
