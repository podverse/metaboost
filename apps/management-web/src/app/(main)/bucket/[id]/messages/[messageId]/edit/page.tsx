import type { ManagementBucket, ManagementBucketMessage } from '@boilerplate/helpers-requests';
import type { BreadcrumbItem } from '@boilerplate/ui';

import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { request } from '@boilerplate/helpers-requests';
import { Breadcrumbs, ContentPageLayout, Link } from '@boilerplate/ui';

import { BucketMessageEditClient } from '../../../../../../../components/buckets/BucketMessageEditClient';
import { getServerManagementApiBaseUrl } from '../../../../../../../config/env';
import { getCrudFlags, hasReadPermission } from '../../../../../../../lib/main-nav';
import { ROUTES } from '../../../../../../../lib/routes';
import { bucketViewRoute } from '../../../../../../../lib/routes';
import { getServerUser } from '../../../../../../../lib/server-auth';
import { getCookieHeader } from '../../../../../../../lib/server-request';

type PageProps = { params: Promise<{ id: string; messageId: string }> };

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

async function fetchMessage(
  bucketId: string,
  messageId: string
): Promise<ManagementBucketMessage | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${bucketId}/messages/${messageId}`, {
    headers: { Cookie: cookieHeader },
    ...requestOptions,
  });
  if (!res.ok || res.data === undefined) return null;
  const data = res.data as { message?: ManagementBucketMessage };
  return data.message ?? null;
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

export default async function BucketMessageEditPage({ params }: PageProps) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const canReadBuckets =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketsCrud');
  if (!canReadBuckets) redirect(ROUTES.DASHBOARD);

  const canReadMessages =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketMessagesCrud');
  const crud = getCrudFlags(user.isSuperAdmin === true, user.permissions, 'bucketMessagesCrud');
  if (!crud.update) redirect(ROUTES.BUCKETS);

  const { id: bucketId, messageId } = await params;
  if (!canReadMessages) redirect(bucketViewRoute(bucketId));

  const [bucket, message] = await Promise.all([
    fetchBucket(bucketId),
    fetchMessage(bucketId, messageId),
  ]);
  if (bucket === null || message === null) notFound();

  const ancestors = await fetchBucketAncestry(bucket);
  const tMessages = await getTranslations('common.bucketMessages');
  const breadcrumbItems: BreadcrumbItem[] = [
    ...ancestors.map((a) => ({ label: a.name, href: bucketViewRoute(a.shortId) })),
    { label: bucket.name, href: bucketViewRoute(bucketId) },
    { label: tMessages('edit'), href: undefined },
  ];

  return (
    <ContentPageLayout
      breadcrumbs={<Breadcrumbs items={breadcrumbItems} LinkComponent={BreadcrumbLink} />}
      contentMaxWidth="form"
    >
      <BucketMessageEditClient
        bucketId={bucketId}
        messageId={messageId}
        initialBody={message.body}
        initialIsPublic={message.isPublic}
        senderName={message.senderName}
        messagesRoute={bucketViewRoute(bucketId)}
      />
    </ContentPageLayout>
  );
}
