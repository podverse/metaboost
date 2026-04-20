import type { BucketMessage } from '@metaboost/orm';
import type { Request } from 'express';

import { isNonNegativeInteger, parseNonNegativeIntegerQueryParam } from '@metaboost/helpers';
import { BucketMessageService, BucketService } from '@metaboost/orm';

type ListFilteredBoostMessagesInput = {
  bucketIds: string[];
  rootBucketId: string;
  requestMinimumAmountMinor: number | undefined;
  page: number;
  limit: number;
  offset: number;
  order: 'ASC' | 'DESC';
  publicOnly: boolean;
  excludeSenderGuids?: string[];
};

type ListFilteredBoostMessagesResult = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  messages: BucketMessage[];
};

type ThresholdContext = {
  preferredCurrency: string;
  minimumAmountMinor: number;
};
const BOOST_ACTIONS: Array<'boost'> = ['boost'];

export function parseMinimumAmountMinorFromQuery(query: Request['query']): number | undefined {
  return parseNonNegativeIntegerQueryParam(query.minimumAmountMinor);
}

export function hasDisallowedThresholdQueryParams(query: Request['query']): boolean {
  return query.minimumAmountUsdCents !== undefined;
}

export async function resolveThresholdContext(
  rootBucketId: string,
  requestMinimumAmountMinor: number | undefined
): Promise<ThresholdContext> {
  const rootBucket = await BucketService.findById(rootBucketId);
  const rootPreferredCurrency =
    rootBucket?.settings?.preferredCurrency ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
  const rootMinimumAmountMinor = rootBucket?.settings?.minimumMessageAmountMinor ?? 0;
  return {
    preferredCurrency: rootPreferredCurrency,
    minimumAmountMinor: Math.max(rootMinimumAmountMinor, requestMinimumAmountMinor ?? 0),
  };
}

export async function resolveEffectiveThresholdFilter(input: {
  rootBucketId: string;
  requestMinimumAmountMinor: number | undefined;
}): Promise<ThresholdContext> {
  const thresholdContext = await resolveThresholdContext(
    input.rootBucketId,
    input.requestMinimumAmountMinor
  );
  if (!isNonNegativeInteger(thresholdContext.minimumAmountMinor)) {
    return {
      preferredCurrency: thresholdContext.preferredCurrency,
      minimumAmountMinor: 0,
    };
  }
  return thresholdContext;
}

export async function listFilteredBoostMessagesByBucketIds(
  input: ListFilteredBoostMessagesInput
): Promise<ListFilteredBoostMessagesResult> {
  if (input.bucketIds.length === 0) {
    return {
      page: input.page,
      limit: input.limit,
      total: 0,
      totalPages: 1,
      messages: [],
    };
  }

  const thresholdFilter = await resolveEffectiveThresholdFilter({
    rootBucketId: input.rootBucketId,
    requestMinimumAmountMinor: input.requestMinimumAmountMinor,
  });
  const baseQuery = {
    publicOnly: input.publicOnly,
    actions: BOOST_ACTIONS,
    order: input.order,
    excludeSenderGuids: input.excludeSenderGuids,
    minimumThresholdAmountMinor:
      thresholdFilter.minimumAmountMinor > 0 ? thresholdFilter.minimumAmountMinor : undefined,
    thresholdCurrency: thresholdFilter.preferredCurrency,
  };

  const [messages, total] = await Promise.all([
    BucketMessageService.findByBucketIds(input.bucketIds, {
      ...baseQuery,
      limit: input.limit,
      offset: input.offset,
    }),
    BucketMessageService.countByBucketIds(input.bucketIds, baseQuery),
  ]);
  return {
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
    messages,
  };
}
