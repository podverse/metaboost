'use client';

import type { BucketDetailContentProps } from '@metaboost/ui';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { BucketDetailContent } from '@metaboost/ui';

import { fetchManagementBucketDetailChildBucketsMapped } from '../lib/client/managementChildBucketsListClient';

export type ManagementBucketDetailContentProps = BucketDetailContentProps & {
  bucketIdText: string;
};

export function ManagementBucketDetailContent({
  bucketIdText,
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
      bucketIdText,
      locale,
      sortPrefsCookieName: bucketsSortPrefsCookieName,
      labelPublicYes: tCommon('usersTable.visibilityYes'),
      labelPublicNo: tCommon('usersTable.visibilityNo'),
    });
    setBucketRows(next);
  }, [bucketIdText, locale, bucketsSortPrefsCookieName, tCommon]);

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
