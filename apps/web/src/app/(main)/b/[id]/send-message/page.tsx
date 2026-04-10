import type { PublicBucket } from '@metaboost/helpers-requests';
import type { BreadcrumbItem } from '@metaboost/ui';

import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { webBuckets } from '@metaboost/helpers-requests';
import { ContentPageLayout, SectionWithHeading, Stack } from '@metaboost/ui';

import { publicBucketRoute } from '../../../../../lib/routes';
import { getServerApiBaseUrl } from '../../../../../lib/server-request';
import { PublicSubmitForm } from '../../PublicSubmitForm';
import { PublicBucketBreadcrumbs } from '../PublicBucketBreadcrumbs';

async function fetchPublicBucket(id: string): Promise<PublicBucket | null> {
  const baseUrl = getServerApiBaseUrl();
  const res = await webBuckets.reqFetchPublicBucket(baseUrl, id);
  if (!res.ok || res.data === undefined) return null;
  const bucket = res.data.bucket;
  return bucket !== undefined && typeof bucket?.id === 'string' ? bucket : null;
}

export default async function PublicSubmitMessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bucket = await fetchPublicBucket(id);
  if (bucket === null || !bucket.isPublic) {
    notFound();
  }

  const t = await getTranslations('buckets');
  const ancestors = bucket.ancestors ?? [];
  const showBreadcrumbs = ancestors.length > 0;
  const breadcrumbItems: BreadcrumbItem[] = showBreadcrumbs
    ? [
        ...ancestors.map((a) => ({ label: a.name, href: publicBucketRoute(a.shortId) })),
        { label: bucket.name, href: publicBucketRoute(bucket.shortId) },
        { label: t('submitMessageTitle'), href: undefined },
      ]
    : [];
  const successHref = publicBucketRoute(bucket.shortId);

  return (
    <ContentPageLayout
      title={bucket.name}
      breadcrumbs={
        showBreadcrumbs ? <PublicBucketBreadcrumbs items={breadcrumbItems} /> : undefined
      }
      contentMaxWidth="readable"
    >
      <Stack>
        <SectionWithHeading title={t('submitMessageTitle')}>
          <PublicSubmitForm
            bucketId={bucket.id}
            messageBodyMaxLength={bucket.messageBodyMaxLength}
            successHref={successHref}
          />
        </SectionWithHeading>
      </Stack>
    </ContentPageLayout>
  );
}
