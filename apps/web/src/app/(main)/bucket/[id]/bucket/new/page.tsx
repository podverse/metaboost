import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { Breadcrumbs, Container, Link, SectionWithHeading } from '@metaboost/ui';

import { canCreateChildBuckets } from '../../../../../../lib/bucket-authz';
import { fetchBucket, fetchBucketAncestry } from '../../../../../../lib/buckets';
import {
  ROUTES,
  bucketDetailRssNetworkAfterAddCancelRoute,
  bucketDetailRoute,
} from '../../../../../../lib/routes';
import { getServerUser } from '../../../../../../lib/server-auth';
import { RssChannelForm } from '../../../../buckets/RssChannelForm';

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
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const { id: bucketId } = await params;
  const { bucket } = await fetchBucket(bucketId);
  if (bucket === null) {
    notFound();
  }
  if (bucket.type !== 'rss-network') {
    notFound();
  }
  const canCreate = await canCreateChildBuckets(bucket.id, bucket.ownerId, user);
  if (!canCreate) {
    notFound();
  }

  const [t, ancestors] = await Promise.all([
    getTranslations('buckets'),
    fetchBucketAncestry(bucket),
  ]);
  const bucketHref = bucketDetailRssNetworkAfterAddCancelRoute(bucketId);
  const breadcrumbItems: BreadcrumbItem[] = [
    ...ancestors.map((a) => ({ label: a.name, href: bucketDetailRoute(a.shortId) })),
    { label: bucket.name, href: bucketHref },
    { label: t('addRssChannel'), href: undefined },
  ];

  return (
    <Container>
      <Breadcrumbs
        items={breadcrumbItems}
        LinkComponent={BreadcrumbLink}
        ariaLabel={t('buckets')}
      />
      <SectionWithHeading title={t('addRssChannel')}>
        <RssChannelForm parentBucketId={bucketId} cancelHref={bucketHref} />
      </SectionWithHeading>
    </Container>
  );
}
