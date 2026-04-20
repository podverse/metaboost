'use client';

import type { BucketDetailContentProps } from '@metaboost/ui';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { BucketDetailContent } from '@metaboost/ui';

import { fetchManagementBucketDetailChildBucketsMapped } from '../lib/client/managementChildBucketsListClient';

export type ManagementBucketDetailContentProps = BucketDetailContentProps & {
  bucketShortId: string;
};

export function ManagementBucketDetailContent({
  bucketShortId,
  buckets,
  bucketsSortPrefsCookieName,
  ...rest
}: ManagementBucketDetailContentProps) {
  const [bucketRows, setBucketRows] = useState(buckets);
  const locale = useLocale();
  const tCommon = useTranslations('common');

  useEffect(() => {
    setBucketRows(buckets);
  }, [buckets]);

  const onBucketsSortMetadataChange = useCallback(async () => {
    if (bucketsSortPrefsCookieName === undefined || bucketsSortPrefsCookieName.trim() === '') {
      return;
    }
    const next = await fetchManagementBucketDetailChildBucketsMapped({
      bucketShortId,
      locale,
      sortPrefsCookieName: bucketsSortPrefsCookieName,
      labelPublicYes: tCommon('usersTable.visibilityYes'),
      labelPublicNo: tCommon('usersTable.visibilityNo'),
    });
    setBucketRows(next);
  }, [bucketShortId, locale, bucketsSortPrefsCookieName, tCommon]);

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
