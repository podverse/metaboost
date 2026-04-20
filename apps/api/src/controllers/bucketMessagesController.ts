import type { BucketType } from '@metaboost/helpers-requests';
import type { Request, Response } from 'express';

import { DEFAULT_PAGE_LIMIT, isTruthyQueryFlag, MAX_PAGE_SIZE } from '@metaboost/helpers';
import { BucketBlockedSenderService, BucketMessageService, BucketService } from '@metaboost/orm';

import { listBlockedSenderGuidsForBucket } from '../lib/blocked-sender-scope.js';
import { getBucketContext } from '../lib/bucket-context.js';
import { getBucketAndEffective } from '../lib/bucket-effective.js';
import { canReadBucket, canReadMessage, canDeleteMessage } from '../lib/bucket-policy.js';
import {
  convertToBaselineAmount,
  getExchangeRates,
  getSupportedBaselineCurrencies,
  resolveEffectiveBaselineCurrency,
} from '../lib/exchangeRates.js';
import {
  hasDisallowedThresholdQueryParams,
  listFilteredBoostMessagesByBucketIds,
  parseMinimumAmountMinorFromQuery,
  resolveEffectiveThresholdFilter,
} from '../lib/message-threshold-filter.js';
import { withSourceBucketContext } from '../lib/sourceBucketContext.js';

type BucketSummaryRangePreset = '24h' | '7d' | '30d' | '1y' | 'all-time' | 'custom';

type BucketSummaryRange = {
  preset: BucketSummaryRangePreset;
  from: Date | null;
  to: Date | null;
  timeBucket: 'hour' | 'day' | 'month';
};

async function getMessageBucketIdsForScope(bucket: {
  id: string;
  type: BucketType;
}): Promise<string[]> {
  if (
    bucket.type === 'rss-channel' ||
    bucket.type === 'mb-root' ||
    bucket.type === 'mb-mid' ||
    bucket.type === 'rss-network'
  ) {
    const descendantIds = await BucketService.findDescendantIds(bucket.id);
    if (bucket.type === 'rss-network') {
      return descendantIds;
    }
    return [bucket.id, ...descendantIds];
  }
  return [bucket.id];
}

function parseIsoDateParam(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveSummaryRange(req: Request): BucketSummaryRange {
  const presetRaw = typeof req.query.range === 'string' ? req.query.range.trim() : '';
  const preset: BucketSummaryRangePreset =
    presetRaw === '24h' ||
    presetRaw === '7d' ||
    presetRaw === '30d' ||
    presetRaw === '1y' ||
    presetRaw === 'all-time' ||
    presetRaw === 'custom'
      ? presetRaw
      : '30d';
  const now = new Date();

  if (preset === 'all-time') {
    return { preset, from: null, to: null, timeBucket: 'month' };
  }
  if (preset === 'custom') {
    const from = parseIsoDateParam(req.query.from);
    const to = parseIsoDateParam(req.query.to);
    if (from === null || to === null || from > to) {
      return {
        preset: '30d',
        from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: now,
        timeBucket: 'day',
      };
    }
    const spanMs = Math.max(0, to.getTime() - from.getTime());
    const dayMs = 24 * 60 * 60 * 1000;
    const timeBucket = spanMs <= 2 * dayMs ? 'hour' : spanMs <= 120 * dayMs ? 'day' : 'month';
    return { preset, from, to, timeBucket };
  }
  if (preset === '24h') {
    return {
      preset,
      from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      to: now,
      timeBucket: 'hour',
    };
  }
  if (preset === '7d') {
    return {
      preset,
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      to: now,
      timeBucket: 'day',
    };
  }
  if (preset === '1y') {
    return {
      preset,
      from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      to: now,
      timeBucket: 'month',
    };
  }
  return {
    preset: '30d',
    from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    to: now,
    timeBucket: 'day',
  };
}

async function resolveDashboardBucketIds(userId: string): Promise<string[]> {
  const roots = await BucketService.findAccessibleByUser(userId);
  const all = new Set<string>();
  await Promise.all(
    roots.map(async (bucket) => {
      all.add(bucket.id);
      const descendants = await BucketService.findDescendantIds(bucket.id);
      for (const descendantId of descendants) {
        all.add(descendantId);
      }
    })
  );
  return [...all];
}

async function buildSummaryPayload(
  messageBucketIds: string[],
  preferredCurrency: string | null | undefined,
  range: BucketSummaryRange,
  includeBlockedSenderMessages: boolean
): Promise<{
  baselineCurrency: string;
  range: { preset: BucketSummaryRangePreset; from: string | null; to: string | null };
  totals: { convertedAmount: string; messageCount: number; ignoredConversionEntries: number };
  breakdown: Array<{
    currency: string | null;
    amountUnit: string | null;
    totalAmount: string;
    convertedAmount: string | null;
    messageCount: number;
    includedInConvertedTotal: boolean;
  }>;
  series: Array<{ bucketStart: string; convertedAmount: string; messageCount: number }>;
  supportedBaselineCurrencies: string[];
}> {
  const rates = await getExchangeRates();
  const groups = await BucketService.groupBucketIdsByRoot(messageBucketIds);
  const blockedGuidsByRoot = new Map<string, string[]>();
  for (const rootId of groups.keys()) {
    blockedGuidsByRoot.set(
      rootId,
      await BucketBlockedSenderService.listGuidsByRootBucketId(rootId)
    );
  }
  const messageChunks: Awaited<ReturnType<typeof BucketMessageService.findByBucketIds>>[] = [];
  for (const [rootId, ids] of groups) {
    const guids = includeBlockedSenderMessages ? undefined : (blockedGuidsByRoot.get(rootId) ?? []);
    const count = await BucketMessageService.countByBucketIds(ids, {
      actions: ['boost'],
      publicOnly: false,
      excludeSenderGuids: guids,
    });
    if (count === 0) {
      continue;
    }
    messageChunks.push(
      await BucketMessageService.findByBucketIds(ids, {
        actions: ['boost'],
        publicOnly: false,
        limit: count,
        order: 'ASC',
        excludeSenderGuids: guids,
      })
    );
  }
  const messages = messageChunks.flat().sort((a, b) => {
    const ta =
      a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const tb =
      b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return ta - tb;
  });
  const filteredMessages = messages.filter((message) => {
    const createdAt =
      message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt);
    if (range.from !== null && createdAt < range.from) {
      return false;
    }
    if (range.to !== null && createdAt > range.to) {
      return false;
    }
    return true;
  });
  const baselineCurrency = resolveEffectiveBaselineCurrency(preferredCurrency, rates);
  let convertedTotal = 0;
  let ignoredConversionEntries = 0;
  const breakdownByKey = new Map<
    string,
    {
      currency: string | null;
      amountUnit: string | null;
      totalAmount: number;
      messageCount: number;
    }
  >();
  const seriesMap = new Map<string, { convertedAmount: number; messageCount: number }>();
  const truncateDate = (date: Date): string => {
    const next = new Date(date);
    if (range.timeBucket === 'hour') {
      next.setUTCMinutes(0, 0, 0);
    } else if (range.timeBucket === 'day') {
      next.setUTCHours(0, 0, 0, 0);
    } else {
      next.setUTCDate(1);
      next.setUTCHours(0, 0, 0, 0);
    }
    return next.toISOString();
  };
  for (const message of filteredMessages) {
    const amount = Number.parseFloat(message.amount ?? '0');
    const key = `${message.currency ?? ''}|${message.amountUnit ?? ''}`;
    const current = breakdownByKey.get(key) ?? {
      currency: message.currency ?? null,
      amountUnit: message.amountUnit ?? null,
      totalAmount: 0,
      messageCount: 0,
    };
    current.totalAmount += Number.isFinite(amount) ? amount : 0;
    current.messageCount += 1;
    breakdownByKey.set(key, current);

    const converted = convertToBaselineAmount(
      {
        amount: Number.isFinite(amount) ? amount : 0,
        currency: message.currency,
        amountUnit: message.amountUnit,
      },
      baselineCurrency,
      rates
    );
    if (converted !== null) {
      convertedTotal += converted;
      const bucketStart = truncateDate(
        message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt)
      );
      const point = seriesMap.get(bucketStart) ?? { convertedAmount: 0, messageCount: 0 };
      point.convertedAmount += converted;
      point.messageCount += 1;
      seriesMap.set(bucketStart, point);
    } else {
      ignoredConversionEntries += 1;
    }
  }
  const breakdown = [...breakdownByKey.values()].map((row) => {
    const converted = convertToBaselineAmount(
      {
        amount: row.totalAmount,
        currency: row.currency,
        amountUnit: row.amountUnit,
      },
      baselineCurrency,
      rates
    );
    return {
      currency: row.currency,
      amountUnit: row.amountUnit,
      totalAmount: String(row.totalAmount),
      convertedAmount: converted !== null ? String(converted) : null,
      messageCount: row.messageCount,
      includedInConvertedTotal: converted !== null,
    };
  });
  const series = [...seriesMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([bucketStart, value]) => ({
      bucketStart,
      convertedAmount: String(value.convertedAmount),
      messageCount: value.messageCount,
    }));

  return {
    baselineCurrency,
    range: {
      preset: range.preset,
      from: range.from !== null ? range.from.toISOString() : null,
      to: range.to !== null ? range.to.toISOString() : null,
    },
    totals: {
      convertedAmount: String(convertedTotal),
      messageCount: filteredMessages.length,
      ignoredConversionEntries,
    },
    breakdown,
    series,
    supportedBaselineCurrencies: getSupportedBaselineCurrencies(rates),
  };
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  if (hasDisallowedThresholdQueryParams(req.query)) {
    res.status(400).json({
      message: 'Unsupported threshold query parameter. Use minimumAmountMinor.',
    });
    return;
  }
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canReadBucket });
  if (ctx === null) return;
  const { bucket } = ctx.resolved;
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const includeBlocked = isTruthyQueryFlag(req.query.includeBlockedSenderMessages);
  const excludeSenderGuids = includeBlocked
    ? undefined
    : await listBlockedSenderGuidsForBucket(bucket.id);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const offset = (page - 1) * limit;
  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const order = sortRaw === 'oldest' ? 'ASC' : 'DESC';
  const rootBucketId = await BucketService.resolveRootBucketId(bucket.id);
  if (rootBucketId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const requestMinimumAmountMinor = parseMinimumAmountMinorFromQuery(req.query);
  const result = await listFilteredBoostMessagesByBucketIds({
    bucketIds: messageBucketIds,
    rootBucketId,
    requestMinimumAmountMinor,
    page,
    limit,
    offset,
    order,
    publicOnly: false,
    excludeSenderGuids,
  });
  const messagesWithContext = await withSourceBucketContext(result.messages);
  res.status(200).json({
    messages: messagesWithContext,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const range = resolveSummaryRange(req);
  const bucketIds = await resolveDashboardBucketIds(user.id);
  const preferredCurrency =
    typeof req.query.baselineCurrency === 'string' && req.query.baselineCurrency.trim() !== ''
      ? req.query.baselineCurrency.trim()
      : (user.bio?.preferredCurrency ?? null);
  const includeBlocked = isTruthyQueryFlag(req.query.includeBlockedSenderMessages);
  const summary = await buildSummaryPayload(bucketIds, preferredCurrency, range, includeBlocked);
  res.status(200).json(summary);
}

export async function getBucketSummary(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canReadBucket });
  if (ctx === null) return;
  const range = resolveSummaryRange(req);
  const { bucket } = ctx.resolved;
  const bucketIds = await getMessageBucketIdsForScope(bucket);
  const preferredCurrency =
    typeof req.query.baselineCurrency === 'string' && req.query.baselineCurrency.trim() !== ''
      ? req.query.baselineCurrency.trim()
      : (ctx.user.bio?.preferredCurrency ?? null);
  const includeBlocked = isTruthyQueryFlag(req.query.includeBlockedSenderMessages);
  const summary = await buildSummaryPayload(bucketIds, preferredCurrency, range, includeBlocked);
  res.status(200).json(summary);
}

export async function getMessage(req: Request, res: Response): Promise<void> {
  if (hasDisallowedThresholdQueryParams(req.query)) {
    res.status(400).json({
      message: 'Unsupported threshold query parameter. Use minimumAmountMinor.',
    });
    return;
  }
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canReadBucket });
  if (ctx === null) return;
  const messageId = req.params.id as string;
  const { bucket, effectiveBucket } = ctx.resolved;
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const message = await BucketMessageService.findById(messageId, { actions: ['boost'] });
  if (message === null || !messageBucketIds.includes(message.bucketId)) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  const messageBucket = await BucketService.findById(message.bucketId);
  if (messageBucket === null) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  if (!canReadMessage(ctx.user.id, effectiveBucket, ctx.bucketAdmin, messageBucket.isPublic)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  const rootBucketId = await BucketService.resolveRootBucketId(bucket.id);
  if (rootBucketId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const thresholdFilter = await resolveEffectiveThresholdFilter({
    rootBucketId,
    requestMinimumAmountMinor: parseMinimumAmountMinorFromQuery(req.query),
  });
  if (thresholdFilter.minimumAmountMinor > 0) {
    const thresholdAmountMinorAtCreate = message.thresholdAmountMinorAtCreate;
    if (
      thresholdAmountMinorAtCreate === null ||
      message.thresholdCurrencyAtCreate !== thresholdFilter.preferredCurrency ||
      thresholdAmountMinorAtCreate < thresholdFilter.minimumAmountMinor
    ) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }
  }
  const [messageWithContext] = await withSourceBucketContext([message]);
  res.status(200).json({ message: messageWithContext ?? message });
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canDeleteMessage });
  if (ctx === null) return;
  const messageId = req.params.id as string;
  const { bucket, effectiveBucket } = ctx.resolved;
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const message = await BucketMessageService.findById(messageId);
  if (message === null || !messageBucketIds.includes(message.bucketId)) {
    res.status(404).json({ message: 'Message not found' });
    return;
  }
  if (!canDeleteMessage(ctx.user.id, effectiveBucket, ctx.bucketAdmin, message)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  await BucketMessageService.delete(messageId);
  res.status(204).send();
}

/** Public: list public messages in a bucket by short_id (only if bucket is public). */
export async function listPublicMessages(req: Request, res: Response): Promise<void> {
  if (hasDisallowedThresholdQueryParams(req.query)) {
    res.status(400).json({
      message: 'Unsupported threshold query parameter. Use minimumAmountMinor.',
    });
    return;
  }
  const id = req.params.id as string;
  const resolved = await getBucketAndEffective(id);
  if (resolved === null || !resolved.bucket.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const { bucket } = resolved;
  const messageBucketIds = await getMessageBucketIdsForScope(bucket);
  const excludeSenderGuids = await listBlockedSenderGuidsForBucket(bucket.id);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const offset = (page - 1) * limit;
  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const order = sortRaw === 'oldest' ? 'ASC' : 'DESC';
  const rootBucketId = await BucketService.resolveRootBucketId(bucket.id);
  if (rootBucketId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const requestMinimumAmountMinor = parseMinimumAmountMinorFromQuery(req.query);
  const result = await listFilteredBoostMessagesByBucketIds({
    bucketIds: messageBucketIds,
    rootBucketId,
    requestMinimumAmountMinor,
    page,
    limit,
    offset,
    order,
    publicOnly: true,
    excludeSenderGuids,
  });
  const messagesWithContext = await withSourceBucketContext(result.messages);
  res.status(200).json({
    messages: messagesWithContext,
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
}
