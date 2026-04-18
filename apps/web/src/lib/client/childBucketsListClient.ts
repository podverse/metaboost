'use client';

import type { Bucket } from '@metaboost/helpers-requests';

import { formatDateTimeReadable } from '@metaboost/helpers-i18n/client';
import { webBuckets } from '@metaboost/helpers-requests';
import {
  BUCKET_DETAIL_BUCKETS_LIST_KEY,
  getSortPrefsFromCookie,
  type BucketDetailBucket,
} from '@metaboost/ui';

import { getApiBaseUrl } from '../api-client';
import { bucketDetailRoute } from '../routes';

export async function fetchBucketDetailChildBucketsMapped(args: {
  bucketShortId: string;
  locale: string;
  sortPrefsCookieName: string;
  labelPublicYes: string;
  labelPublicNo: string;
}): Promise<BucketDetailBucket[]> {
  const prefs = getSortPrefsFromCookie(args.sortPrefsCookieName, BUCKET_DETAIL_BUCKETS_LIST_KEY);
  const sortBy = prefs?.sortBy ?? 'name';
  const sortOrder = prefs?.sortOrder ?? 'asc';
  const res = await webBuckets.reqFetchChildBuckets(
    getApiBaseUrl(),
    args.bucketShortId,
    undefined,
    {
      sortBy,
      sortOrder,
    }
  );
  if (!res.ok || res.data === undefined || !Array.isArray(res.data.buckets)) {
    return [];
  }
  return res.data.buckets.map((b: Bucket) =>
    mapBucketToDetailRow(b, args.locale, args.labelPublicYes, args.labelPublicNo)
  );
}

function mapBucketToDetailRow(
  childBucket: Bucket,
  locale: string,
  labelPublicYes: string,
  labelPublicNo: string
): BucketDetailBucket {
  return {
    id: childBucket.id,
    name: childBucket.name,
    href: bucketDetailRoute(childBucket.shortId),
    createdAtDisplay: formatDateTimeReadable(locale, childBucket.createdAt),
    lastMessageAtDisplay:
      childBucket.lastMessageAt !== undefined && childBucket.lastMessageAt !== null
        ? formatDateTimeReadable(locale, childBucket.lastMessageAt)
        : null,
    isPublicDisplay: childBucket.isPublic ? labelPublicYes : labelPublicNo,
  };
}
