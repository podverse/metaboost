import type { ListTopLevelBucketsQuery } from '@metaboost/helpers-requests';

/**
 * Maps merged dashboard URL + cookie state to GET /buckets query (apps/api listBuckets).
 */
export function mergedDashboardStateToTopLevelBucketsQuery(args: {
  mergedSearch: string;
  mergedSortBy: string;
  mergedSortOrder: string;
}): ListTopLevelBucketsQuery | undefined {
  const q: ListTopLevelBucketsQuery = {};
  const search = args.mergedSearch.trim();
  if (search !== '') {
    q.search = search;
  }
  const sortBy = args.mergedSortBy.trim();
  if (sortBy !== '') {
    q.sortBy = sortBy;
  }
  if (args.mergedSortOrder === 'asc' || args.mergedSortOrder === 'desc') {
    q.sortOrder = args.mergedSortOrder;
  }
  if (q.search === undefined && q.sortBy === undefined && q.sortOrder === undefined) {
    return undefined;
  }
  return q;
}
