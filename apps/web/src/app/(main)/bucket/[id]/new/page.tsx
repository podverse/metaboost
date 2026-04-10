import type { BreadcrumbItem } from '@boilerplate/ui';

import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { Breadcrumbs, Container, Link, SectionWithHeading } from '@boilerplate/ui';

import { canCreateChildBuckets } from '../../../../../lib/bucket-authz';
import { fetchBucket } from '../../../../../lib/buckets';
import { ROUTES, bucketDetailTabRoute } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';
import { TopicForm } from '../../../buckets/TopicForm';

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
  const canCreate = await canCreateChildBuckets(bucket.id, bucket.ownerId, user);
  if (!canCreate) {
    notFound();
  }

  const t = await getTranslations('buckets');
  const bucketHref = bucketDetailTabRoute(bucketId, 'buckets');
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: bucket.name, href: bucketDetailTabRoute(bucketId) },
    { label: t('addBucket'), href: undefined },
  ];

  return (
    <Container>
      <Breadcrumbs
        items={breadcrumbItems}
        LinkComponent={BreadcrumbLink}
        ariaLabel={t('buckets')}
      />
      <SectionWithHeading title={t('addBucket')}>
        <TopicForm parentBucketId={bucketId} successHref={bucketHref} cancelHref={bucketHref} />
      </SectionWithHeading>
    </Container>
  );
}
