import type { ManagementBucket } from '@metaboost/helpers-requests';
import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { Breadcrumbs, Container, Link, SectionWithHeading } from '@metaboost/ui';

import { getServerManagementApiBaseUrl } from '../../../../../config/env';
import { getCrudFlags, hasReadPermission } from '../../../../../lib/main-nav';
import { ROUTES, bucketDetailTabRoute, bucketViewRoute } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';
import { getCookieHeader } from '../../../../../lib/server-request';
import { NewChildBucketFormClient } from './NewChildBucketFormClient';

const requestOptions = { cache: 'no-store' as RequestCache } as const;

async function fetchBucket(id: string): Promise<ManagementBucket | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${id}`, {
    headers: { Cookie: cookieHeader },
    ...requestOptions,
  });
  if (!res.ok || res.data === undefined) return null;
  const data = res.data as { bucket?: ManagementBucket };
  return data.bucket ?? null;
}

async function fetchBucketAncestry(bucket: ManagementBucket): Promise<ManagementBucket[]> {
  const parents: ManagementBucket[] = [];
  let parentId = bucket.parentBucketId;
  while (parentId !== null) {
    const parent = await fetchBucket(parentId);
    if (parent === null) break;
    parents.unshift(parent);
    parentId = parent.parentBucketId;
  }
  return parents;
}

function BreadcrumbLink({
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

export default async function NewChildBucketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const canReadBuckets =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketsCrud');
  if (!canReadBuckets) redirect(ROUTES.DASHBOARD);

  const bucketsCrud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'bucketsCrud');
  if (!bucketsCrud.create) notFound();

  const { id: bucketId } = await params;
  const bucket = await fetchBucket(bucketId);
  if (bucket === null) notFound();

  const ancestors = await fetchBucketAncestry(bucket);
  const tCommon = await getTranslations('common');
  const parentHref = bucketDetailTabRoute(bucket.shortId, 'buckets');
  const breadcrumbItems: BreadcrumbItem[] = [
    ...ancestors.map((a) => ({ label: a.name, href: bucketViewRoute(a.shortId) })),
    { label: bucket.name, href: bucketViewRoute(bucket.shortId) },
    { label: tCommon('bucketDetail.addBucket'), href: undefined },
  ];

  return (
    <Container>
      <Breadcrumbs
        items={breadcrumbItems}
        LinkComponent={BreadcrumbLink}
        ariaLabel={tCommon('bucketDetail.buckets')}
      />
      <SectionWithHeading title={tCommon('bucketDetail.addBucket')}>
        <NewChildBucketFormClient
          parentBucketId={bucketId}
          successHref={parentHref}
          cancelHref={parentHref}
        />
      </SectionWithHeading>
    </Container>
  );
}
