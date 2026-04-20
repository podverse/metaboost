'use client';

import type { ManagementBucket } from '@metaboost/helpers-requests';

import { formatDateTimeReadable } from '@metaboost/helpers-i18n/client';
import { managementWebBuckets } from '@metaboost/helpers-requests';
import {
  BUCKET_DETAIL_BUCKETS_LIST_KEY,
  getSortPrefsFromCookie,
  type BucketDetailBucket,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';
import { bucketViewRoute } from '../routes';

export async function fetchManagementBucketDetailChildBucketsMapped(args: {
  bucketShortId: string;
  locale: string;
  sortPrefsCookieName: string;
  labelPublicYes: string;
  labelPublicNo: string;
}): Promise<BucketDetailBucket[]> {
  const prefs = getSortPrefsFromCookie(args.sortPrefsCookieName, BUCKET_DETAIL_BUCKETS_LIST_KEY);
  const sortBy = prefs?.sortBy ?? 'name';
  const sortOrder = prefs?.sortOrder ?? 'asc';
  const res = await managementWebBuckets.getChildBuckets(
    getManagementApiBaseUrl(),
    args.bucketShortId,
    {
      sortBy,
      sortOrder,
      credentials: 'include',
    }
  );
  if (!res.ok || res.data === undefined || !Array.isArray(res.data.buckets)) {
    return [];
  }
  return res.data.buckets.map((b: ManagementBucket) =>
    mapManagementBucketToDetailRow(b, args.locale, args.labelPublicYes, args.labelPublicNo)
  );
}

function mapManagementBucketToDetailRow(
  childBucket: ManagementBucket,
  locale: string,
  labelPublicYes: string,
  labelPublicNo: string
): BucketDetailBucket {
  return {
    id: childBucket.id,
    name: childBucket.name,
    href: bucketViewRoute(childBucket.shortId),
    createdAtDisplay: formatDateTimeReadable(locale, childBucket.createdAt),
    lastMessageAtDisplay:
      childBucket.lastMessageAt !== undefined && childBucket.lastMessageAt !== null
        ? formatDateTimeReadable(locale, childBucket.lastMessageAt)
        : null,
    isPublicDisplay: childBucket.isPublic ? labelPublicYes : labelPublicNo,
  };
}
