import type { ManagementBucket } from '@boilerplate/helpers-requests';
import type { BreadcrumbItem } from '@boilerplate/ui';

import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { request } from '@boilerplate/helpers-requests';

import { getServerManagementApiBaseUrl } from '../../../../../config/env';
import { hasReadPermission } from '../../../../../lib/main-nav';
import { ROUTES } from '../../../../../lib/routes';
import { bucketViewRoute } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';
import { getCookieHeader } from '../../../../../lib/server-request';
import { BucketSettingsLayoutClient } from './BucketSettingsLayoutClient';

async function fetchBucket(id: string): Promise<ManagementBucket | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${id}`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined) return null;
  const data = res.data as { bucket?: ManagementBucket };
  return data.bucket ?? null;
}

async function fetchBucketAncestry(bucket: ManagementBucket): Promise<ManagementBucket[]> {
  if (bucket.parentBucketId === null) return [];
  const parents: ManagementBucket[] = [];
  let parentId: string | null = bucket.parentBucketId;
  while (parentId !== null) {
    const parent = await fetchBucket(parentId);
    if (parent === null) break;
    parents.unshift(parent);
    parentId = parent.parentBucketId;
  }
  return parents;
}

export default async function BucketSettingsLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const canReadBuckets =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketsCrud');
  if (!canReadBuckets) redirect(ROUTES.DASHBOARD);

  const { id } = await params;
  const bucket = await fetchBucket(id);
  if (bucket === null) notFound();

  const [t, ancestors] = await Promise.all([
    getTranslations('buckets'),
    fetchBucketAncestry(bucket),
  ]);
  const ancestorItems: BreadcrumbItem[] = ancestors.map((a) => ({
    label: a.name,
    href: bucketViewRoute(a.shortId),
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
