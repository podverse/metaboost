'use client';

import type { BucketDetailContentProps } from '@metaboost/ui';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { BucketDetailContent } from '@metaboost/ui';

import { fetchBucketDetailChildBucketsMapped } from '../lib/client/childBucketsListClient';

export type WebBucketDetailContentProps = BucketDetailContentProps & {
  bucketIdText: string;
};

export function WebBucketDetailContent({
  bucketIdText,
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
      bucketIdText,
      locale,
      sortPrefsCookieName: bucketsSortPrefsCookieName,
      labelPublicYes: t('publicYes'),
      labelPublicNo: t('publicNo'),
    });
    setBucketRows(next);
  }, [bucketIdText, locale, bucketsSortPrefsCookieName, t]);

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
