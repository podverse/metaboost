import type { BucketType } from '@metaboost/helpers-requests';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { Container, SectionWithHeading, Text } from '@metaboost/ui';

import { BucketsTableWithFilter } from '../../../components/BucketsTableWithFilter';
import { BucketSummaryPanel } from '../../../components/BucketSummaryPanel';
import { TABLE_SORT_PREFS_COOKIE_NAME } from '../../../lib/cookies';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { getCookieHeader, getServerApiBaseUrl } from '../../../lib/server-request';

type Bucket = {
  id: string;
  shortId: string;
  ownerId: string;
  name: string;
  type: BucketType;
  isPublic: boolean;
};

async function fetchBuckets(): Promise<Bucket[]> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await request<{ buckets?: Bucket[] }>(baseUrl, '/buckets', {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined || !Array.isArray(res.data.buckets)) {
    return [];
  }
  return res.data.buckets;
}

function getBucketTypeLabel(
  t: Awaited<ReturnType<typeof getTranslations>>,
  bucketType: Bucket['type']
): string {
  if (bucketType === 'rss-channel') return t('bucketTypeRssChannel');
  if (bucketType === 'rss-network') return t('bucketTypeRssNetwork');
  if (bucketType === 'mb-root' || bucketType === 'mb-mid' || bucketType === 'mb-leaf') {
    return t('bucketTypeCustom');
  }
  return t('bucketTypeRssItem');
}

export default async function DashboardPage() {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const t = await getTranslations('dashboard');
  const tBuckets = await getTranslations('buckets');
  const displayName = user.displayName ?? user.username ?? user.email ?? '—';
  const signedInAsLabel = user.email ?? user.username ?? '—';
  const buckets = await fetchBuckets();
  const tableRows = buckets.map((b) => ({
    id: b.shortId,
    cells: {
      name: b.name,
      isPublic: b.isPublic ? tBuckets('publicYes') : tBuckets('publicNo'),
      type: getBucketTypeLabel(tBuckets, b.type),
    },
  }));
  const columns = [
    { id: 'name', label: tBuckets('name'), defaultSortOrder: 'asc' as const },
    { id: 'isPublic', label: tBuckets('isPublic'), defaultSortOrder: 'asc' as const },
    { id: 'type', label: tBuckets('type') },
  ];

  return (
    <Container>
      <SectionWithHeading title={t('title')}>
        <Text>{t('hello', { name: displayName })}</Text>
        <Text variant="muted">{t('signedInAs', { email: signedInAsLabel })}</Text>
      </SectionWithHeading>
      <BucketSummaryPanel scope="dashboard" />
      <BucketsTableWithFilter
        tableRows={tableRows}
        emptyMessage={buckets.length === 0 ? tBuckets('noBuckets') : undefined}
        columns={columns}
        initialFilterColumns={['name']}
        initialSearch=""
        basePath={ROUTES.DASHBOARD}
        currentQueryParams={{}}
        addBucketHref={ROUTES.BUCKETS_NEW}
        filterableColumnIds={['name']}
        sortableColumnIds={['name', 'isPublic']}
        sortPrefsCookieName={TABLE_SORT_PREFS_COOKIE_NAME}
        sortPrefsListKey="dashboard-buckets"
      />
    </Container>
  );
}
