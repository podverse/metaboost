'use client';

import type { BucketType } from '@metaboost/helpers-requests';
import type { FilterableTableRow } from '@metaboost/ui';

import { webBuckets } from '@metaboost/helpers-requests';

import { getApiBaseUrl } from '../api-client';
import { mergedDashboardStateToTopLevelBucketsQuery } from '../dashboardBucketsApiQuery';
import { buildDashboardBucketsCurrentQueryParams } from '../dashboardBucketsQueryParams';

export type DashboardBucketsTableSnapshot = {
  tableRows: FilterableTableRow[];
  currentQueryParams: Record<string, string>;
  initialSearch: string;
};

export async function fetchDashboardBucketsTableSnapshot(args: {
  sortPrefsCookieName: string;
  tableListStateCookieName: string;
  listKey: string;
  labelPublicYes: string;
  labelPublicNo: string;
  typeLabelFor: (type: BucketType) => string;
}): Promise<DashboardBucketsTableSnapshot | null> {
  const qp = buildDashboardBucketsCurrentQueryParams({
    sortPrefsCookieName: args.sortPrefsCookieName,
    tableListStateCookieName: args.tableListStateCookieName,
    listKey: args.listKey,
  });
  const apiQuery = mergedDashboardStateToTopLevelBucketsQuery({
    mergedSearch: qp.search ?? '',
    mergedSortBy: qp.sortBy ?? '',
    mergedSortOrder: qp.sortOrder ?? '',
  });
  const res = await webBuckets.reqFetchBucketsList(getApiBaseUrl(), undefined, apiQuery);
  if (!res.ok || res.data === undefined || !Array.isArray(res.data.buckets)) {
    return null;
  }
  const tableRows: FilterableTableRow[] = res.data.buckets.map((b) => ({
    id: b.idText,
    cells: {
      name: b.name,
      isPublic: b.isPublic ? args.labelPublicYes : args.labelPublicNo,
      type: args.typeLabelFor(b.type),
    },
  }));
  return {
    tableRows,
    currentQueryParams: qp,
    initialSearch: qp.search ?? '',
  };
}
