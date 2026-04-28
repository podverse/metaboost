import type {
  CreateBucketBody,
  CreateChildBucketBody,
  UpdateBucketBody,
} from '../schemas/buckets.js';
import type { Bucket } from '@metaboost/orm';
import type { Request, Response } from 'express';

import {
  compareStringsEmptyLastLexicographic,
  DEFAULT_PAGE_LIMIT,
  formatUserLabel,
  MAX_PAGE_SIZE,
  MAX_TOTAL_CAP,
  parseSortOrderQueryParam,
} from '@metaboost/helpers';
import { normalizeCurrencyCode } from '@metaboost/helpers-currency';
import {
  BucketBlockedSenderService,
  BucketMessageService,
  BucketService,
  UserService,
} from '@metaboost/orm';

import { getBucketResolved } from '../lib/bucket-context.js';
import { bucketToJson } from '../lib/bucketToJson.js';
import {
  convertToBaselineMinorAmount,
  ExchangeRatesFetchDisabledError,
  getExchangeRates,
} from '../lib/exchangeRates.js';
import { recomputeRootThresholdSnapshots } from '../lib/recompute-threshold-snapshots.js';

const DERIVED_NAME_BUCKET_TYPES: Bucket['type'][] = ['rss-channel', 'rss-item'];
const DEFAULT_MINIMUM_BOOST_USD_AMOUNT_MINOR = 10;
const DEFAULT_MINIMUM_BOOST_USD_AMOUNT_UNIT = 'cents';
const DEFAULT_MINIMUM_BOOST_USD_CURRENCY = 'USD';

async function resolveDefaultMinimumBoostAmountMinor(preferredCurrency: string): Promise<number> {
  const normalizedPreferredCurrency =
    normalizeCurrencyCode(preferredCurrency) ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
  if (normalizedPreferredCurrency === DEFAULT_MINIMUM_BOOST_USD_CURRENCY) {
    return DEFAULT_MINIMUM_BOOST_USD_AMOUNT_MINOR;
  }
  const rates = await getExchangeRates();
  const converted = convertToBaselineMinorAmount(
    {
      amount: DEFAULT_MINIMUM_BOOST_USD_AMOUNT_MINOR,
      currency: DEFAULT_MINIMUM_BOOST_USD_CURRENCY,
      amountUnit: DEFAULT_MINIMUM_BOOST_USD_AMOUNT_UNIT,
    },
    normalizedPreferredCurrency,
    rates
  );
  if (converted === null) {
    throw new Error('Unable to convert default minimum boost amount to preferred currency.');
  }
  return converted;
}

async function isAncestorChainPublic(bucket: Bucket): Promise<boolean> {
  let parentId = bucket.parentBucketId;
  while (parentId !== null) {
    const parent = await BucketService.findById(parentId);
    if (parent === null) {
      return false;
    }
    if (!parent.isPublic) {
      return false;
    }
    parentId = parent.parentBucketId;
  }
  return true;
}

export async function listBuckets(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const searchRaw = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const search = searchRaw === '' ? undefined : searchRaw;
  const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : undefined;
  const sortBy = sortByRaw === '' ? undefined : sortByRaw;
  const sortOrder = parseSortOrderQueryParam(req.query.sortOrder);
  const offset = (page - 1) * limit;

  const { buckets, total } = await BucketService.listPaginated(
    limit,
    offset,
    search,
    sortBy,
    sortOrder
  );
  const cappedTotal = total > MAX_TOTAL_CAP ? MAX_TOTAL_CAP : total;
  const totalPages = Math.max(1, Math.ceil(cappedTotal / limit));
  const truncatedTotal = total > MAX_TOTAL_CAP;

  res.status(200).json({
    buckets: buckets.map((bucket) => bucketToJson(bucket)),
    total: cappedTotal,
    page,
    limit,
    totalPages,
    ...(truncatedTotal && { truncatedTotal: true }),
  });
}

function formatOwnerDisplayName(owner: {
  credentials?: { email?: string | null; username?: string | null };
  bio?: { displayName?: string | null } | null;
}): string {
  return formatUserLabel({
    username: owner.credentials?.username ?? null,
    email: owner.credentials?.email ?? null,
    displayName: owner.bio?.displayName ?? null,
  });
}

/** Resolve bucket by idText or UUID. Use for all :id and :bucketId params so URLs can use short IDs. */
export async function resolveBucket(idOrIdText: string): Promise<Bucket | null> {
  const byIdText = await BucketService.findByIdText(idOrIdText);
  if (byIdText !== null) return byIdText;
  return BucketService.findById(idOrIdText);
}

export async function getBucket(req: Request, res: Response): Promise<void> {
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { bucket, effectiveBucket } = resolved;
  const owner = await UserService.findById(effectiveBucket.ownerId);
  const ownerDisplayName = owner !== null ? formatOwnerDisplayName(owner) : null;
  const overrides =
    bucket.parentBucketId !== null
      ? {
          ownerId: effectiveBucket.ownerId,
          ownerDisplayName,
        }
      : undefined;
  res.status(200).json({
    bucket: bucketToJson(bucket, ownerDisplayName, overrides),
  });
}

export async function createBucket(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateBucketBody;
  const owner = await UserService.findById(body.ownerId);
  if (owner === null) {
    res.status(400).json({ message: 'Owner not found' });
    return;
  }
  try {
    const createdBucket = await BucketService.create({
      ownerId: body.ownerId,
      name: body.name,
      isPublic: body.isPublic ?? true,
      parentBucketId: null,
      topLevelMinimumMessageAmountMinor: await resolveDefaultMinimumBoostAmountMinor(
        BucketService.DEFAULT_PREFERRED_CURRENCY
      ),
    });
    const bucket = await BucketService.findById(createdBucket.id);
    if (bucket === null) {
      throw new Error('Created bucket could not be reloaded.');
    }
    res.status(201).json({ bucket: bucketToJson(bucket) });
  } catch (error) {
    if (error instanceof ExchangeRatesFetchDisabledError) {
      res.status(503).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function updateBucket(req: Request, res: Response): Promise<void> {
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { bucket, effectiveBucket } = resolved;
  const body = req.body as UpdateBucketBody;
  if (body.name !== undefined && DERIVED_NAME_BUCKET_TYPES.includes(bucket.type)) {
    res.status(400).json({
      message: 'Name is derived for RSS channel and item buckets and cannot be edited manually.',
    });
    return;
  }
  if (body.isPublic === true && bucket.parentBucketId !== null) {
    const canSetPublic = await isAncestorChainPublic(bucket);
    if (!canSetPublic) {
      res.status(400).json({
        message: 'A descendant bucket can only be public when all ancestor buckets are public.',
      });
      return;
    }
  }
  const nextPreferredCurrency =
    body.preferredCurrency === undefined
      ? undefined
      : normalizeCurrencyCode(body.preferredCurrency);
  const currentPreferredCurrency =
    bucket.settings?.preferredCurrency ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
  if (
    bucket.parentBucketId === null &&
    nextPreferredCurrency !== undefined &&
    nextPreferredCurrency !== null &&
    nextPreferredCurrency !== currentPreferredCurrency
  ) {
    try {
      await recomputeRootThresholdSnapshots(bucket.id, nextPreferredCurrency);
    } catch {
      res.status(503).json({
        message: 'Unable to recompute threshold snapshots for preferred currency change.',
      });
      return;
    }
  }
  await BucketService.update(bucket.id, {
    name: body.name,
    isPublic: body.isPublic,
    messageBodyMaxLength: body.messageBodyMaxLength,
    preferredCurrency: body.preferredCurrency,
    minimumMessageAmountMinor: body.minimumMessageAmountMinor,
  });
  if (body.applyToDescendants === true) {
    await BucketService.applyGeneralSettingsToDescendants(bucket.id, {
      isPublic: body.isPublic,
      messageBodyMaxLength: body.messageBodyMaxLength,
      preferredCurrency: body.preferredCurrency,
      minimumMessageAmountMinor: body.minimumMessageAmountMinor,
    });
  }
  const updated = await BucketService.findById(bucket.id);
  if (updated === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const overrides =
    updated.parentBucketId !== null
      ? {
          ownerId: effectiveBucket.ownerId,
        }
      : undefined;
  const owner = await UserService.findById(effectiveBucket.ownerId);
  const ownerDisplayName = owner !== null ? formatOwnerDisplayName(owner) : null;
  res.status(200).json({
    bucket: bucketToJson(updated, ownerDisplayName, overrides),
  });
}

export async function deleteBucket(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const bucket = await resolveBucket(id);
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  await BucketService.delete(bucket.id);
  res.status(204).send();
}

/** List child buckets for a bucket. GET /buckets/:id/buckets. Uses effective root for inherited overrides. */
export async function listChildBuckets(req: Request, res: Response): Promise<void> {
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { bucket: parent, effectiveBucket } = resolved;
  const owner = await UserService.findById(effectiveBucket.ownerId);
  const ownerDisplayName = owner !== null ? formatOwnerDisplayName(owner) : null;
  const search =
    typeof req.query.search === 'string' && req.query.search.trim() !== ''
      ? req.query.search.trim()
      : undefined;
  const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : '';
  const sortOrder = parseSortOrderQueryParam(req.query.sortOrder);

  const children = await BucketService.findChildren(parent.id, {
    search,
    sortBy: sortByRaw !== '' ? sortByRaw : undefined,
    sortOrder,
  });
  const childIds = children.map((b) => b.id);
  const rootId = await BucketService.resolveRootBucketId(parent.id);
  const excludeSenderGuids =
    rootId !== null ? await BucketBlockedSenderService.listGuidsByRootBucketId(rootId) : [];
  const lastMessageAtMap = await BucketMessageService.getLatestMessageCreatedAtByBucketIds(
    childIds,
    { excludeSenderGuids }
  );

  let orderedChildren = children;
  if (sortByRaw === 'lastMessage' && sortOrder !== undefined) {
    orderedChildren = [...children].sort((a, b) =>
      compareStringsEmptyLastLexicographic(
        lastMessageAtMap.get(a.id)?.toISOString() ?? '',
        lastMessageAtMap.get(b.id)?.toISOString() ?? '',
        sortOrder
      )
    );
  }

  const overrides = {
    ownerId: effectiveBucket.ownerId,
    ownerDisplayName,
  };
  res.status(200).json({
    buckets: orderedChildren.map((b) =>
      bucketToJson(b, ownerDisplayName, {
        ...overrides,
        lastMessageAt: lastMessageAtMap.get(b.id)?.toISOString() ?? null,
      })
    ),
  });
}

/** Create a child bucket under the given parent. POST /buckets/:id/buckets. */
export async function createChildBucket(req: Request, res: Response): Promise<void> {
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { bucket: parent, effectiveBucket } = resolved;
  const body = req.body as CreateChildBucketBody;
  const childBucket = await BucketService.create({
    ownerId: effectiveBucket.ownerId,
    name: body.name,
    isPublic: body.isPublic ?? true,
    parentBucketId: parent.id,
  });
  const overrides = {
    ownerId: effectiveBucket.ownerId,
  };
  const owner = await UserService.findById(effectiveBucket.ownerId);
  const ownerDisplayName = owner !== null ? formatOwnerDisplayName(owner) : null;
  res.status(201).json({
    bucket: bucketToJson(childBucket, ownerDisplayName, overrides),
  });
}
