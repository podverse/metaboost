import type { BucketType } from '@metaboost/helpers-requests';

/** Shared bucket type cell label for web (server `getTranslations` or client `useTranslations('buckets')`). */
export function bucketTypeCellLabel(t: (key: string) => string, bucketType: BucketType): string {
  if (bucketType === 'rss-channel') return t('bucketTypeRssChannel');
  if (bucketType === 'rss-network') return t('bucketTypeRssNetwork');
  if (bucketType === 'mb-root' || bucketType === 'mb-mid' || bucketType === 'mb-leaf') {
    return t('bucketTypeCustom');
  }
  return t('bucketTypeRssItem');
}
