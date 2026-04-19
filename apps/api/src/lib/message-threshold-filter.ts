import type { BucketMessage } from '@metaboost/orm';
import type { Request } from 'express';

import { isNonNegativeInteger } from '@metaboost/helpers';
import { BucketMessageService, BucketService } from '@metaboost/orm';

import { convertToBaselineMinorAmount, getExchangeRates } from './exchangeRates.js';
import { parseNonNegativeIntegerQueryParam } from './parseNonNegativeIntegerQueryParam.js';

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
  return parseNonNegativeIntegerQueryParam(query.minimumAmountUsdCents);
}

export async function resolveThresholdContext(
  rootBucketId: string,
  requestMinimumAmountMinor: number | undefined
): Promise<ThresholdContext> {
  const rootBucket = await BucketService.findById(rootBucketId);
  const rootPreferredCurrency = rootBucket?.settings?.preferredCurrency ?? 'USD';
  const rootMinimumAmountMinor = rootBucket?.settings?.minimumMessageAmountMinor ?? 0;
  return {
    preferredCurrency: rootPreferredCurrency,
    minimumAmountMinor: Math.max(rootMinimumAmountMinor, requestMinimumAmountMinor ?? 0),
  };
}

export function toMessageAmountMinorInPreferredCurrency(
  message: Pick<BucketMessage, 'amount' | 'currency' | 'amountUnit'>,
  preferredCurrency: string,
  rates: Awaited<ReturnType<typeof getExchangeRates>>
): number | null {
  const amountNumber = Number.parseFloat(message.amount ?? '');
  if (!isNonNegativeInteger(amountNumber)) {
    return null;
  }
  return convertToBaselineMinorAmount(
    {
      amount: amountNumber,
      currency: message.currency,
      amountUnit: message.amountUnit,
    },
    preferredCurrency,
    rates
  );
}

export async function messageMeetsThreshold(
  message: Pick<BucketMessage, 'amount' | 'currency' | 'amountUnit'>,
  context: ThresholdContext
): Promise<boolean> {
  if (context.minimumAmountMinor <= 0) {
    return true;
  }
  const rates = await getExchangeRates();
  const convertedMinor = toMessageAmountMinorInPreferredCurrency(
    message,
    context.preferredCurrency,
    rates
  );
  return convertedMinor !== null && convertedMinor >= context.minimumAmountMinor;
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

  const thresholdContext = await resolveThresholdContext(
    input.rootBucketId,
    input.requestMinimumAmountMinor
  );
  const baseQuery = {
    publicOnly: input.publicOnly,
    actions: BOOST_ACTIONS,
    order: input.order,
    excludeSenderGuids: input.excludeSenderGuids,
  };

  if (thresholdContext.minimumAmountMinor <= 0) {
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

  const totalCandidates = await BucketMessageService.countByBucketIds(input.bucketIds, baseQuery);
  if (totalCandidates === 0) {
    return {
      page: input.page,
      limit: input.limit,
      total: 0,
      totalPages: 1,
      messages: [],
    };
  }

  const [rates, allMessages] = await Promise.all([
    getExchangeRates(),
    BucketMessageService.findByBucketIds(input.bucketIds, {
      ...baseQuery,
      limit: totalCandidates,
      offset: 0,
    }),
  ]);
  const filtered = allMessages.filter((message) => {
    const convertedMinor = toMessageAmountMinorInPreferredCurrency(
      message,
      thresholdContext.preferredCurrency,
      rates
    );
    return convertedMinor !== null && convertedMinor >= thresholdContext.minimumAmountMinor;
  });
  const total = filtered.length;
  return {
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
    messages: filtered.slice(input.offset, input.offset + input.limit),
  };
}
