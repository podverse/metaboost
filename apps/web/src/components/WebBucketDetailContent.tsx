'use client';

import type { BucketDetailContentProps } from '@metaboost/ui';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { BucketDetailContent } from '@metaboost/ui';

import { fetchBucketDetailChildBucketsMapped } from '../lib/client/childBucketsListClient';

export type WebBucketDetailContentProps = BucketDetailContentProps & {
  bucketShortId: string;
};

export function WebBucketDetailContent({
  bucketShortId,
  buckets,
  bucketsSortPrefsCookieName,
  ...rest
}: WebBucketDetailContentProps) {
  const [bucketRows, setBucketRows] = useState(buckets);
  const locale = useLocale();
  const t = useTranslations('buckets');

  useEffect(() => {
    setBucketRows(buckets);
  }, [buckets]);

  const onBucketsSortMetadataChange = useCallback(async () => {
    if (bucketsSortPrefsCookieName === undefined || bucketsSortPrefsCookieName.trim() === '') {
      return;
    }
    const next = await fetchBucketDetailChildBucketsMapped({
      bucketShortId,
      locale,
      sortPrefsCookieName: bucketsSortPrefsCookieName,
      labelPublicYes: t('publicYes'),
      labelPublicNo: t('publicNo'),
    });
    setBucketRows(next);
  }, [bucketShortId, locale, bucketsSortPrefsCookieName, t]);

  return (
    <BucketDetailContent
      {...rest}
      buckets={bucketRows}
      bucketsSortPrefsCookieName={bucketsSortPrefsCookieName}
      onBucketsSortMetadataChange={
        bucketsSortPrefsCookieName !== undefined && bucketsSortPrefsCookieName.trim() !== ''
          ? onBucketsSortMetadataChange
          : undefined
      }
    />
  );
}
