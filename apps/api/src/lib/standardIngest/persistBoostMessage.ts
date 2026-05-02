import type { CreateMbrssV1BoostBody } from '../../schemas/mbrssV1.js';
import type { CreateMbV1BoostBody } from '../../schemas/mbV1.js';

import { MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR } from '@metaboost/helpers';
import { BucketMessageService, BucketService } from '@metaboost/orm';

import { convertToBaselineMinorAmount, getExchangeRates } from '../exchangeRates.js';

type NormalizedCurrency = { currency: string; amountUnit: string };

type PersistBody = Pick<
  CreateMbrssV1BoostBody,
  | 'amount'
  | 'action'
  | 'app_name'
  | 'app_version'
  | 'sender_name'
  | 'sender_guid'
  | 'message'
  | 'podcast_index_feed_id'
  | 'time_position'
>;

/** Persist boost or stream after standard-specific routing resolved `targetBucketId`. */
export async function persistStandardBoostMessage(input: {
  targetBucketId: string;
  body: PersistBody | CreateMbV1BoostBody;
  normalizedValue: NormalizedCurrency;
}): Promise<{ streamResponse: true } | { streamResponse: false; messageGuid: string }> {
  const { targetBucketId, body, normalizedValue } = input;
  const rootBucketId = await BucketService.resolveRootBucketId(targetBucketId);
  if (rootBucketId === null) {
    throw new Error('Unable to resolve root bucket for threshold snapshot');
  }
  const rootBucket = await BucketService.findById(rootBucketId);
  if (rootBucket === null) {
    throw new Error('Root bucket not found for threshold snapshot');
  }
  const thresholdCurrencyAtCreate = rootBucket.settings?.preferredCurrency;
  if (thresholdCurrencyAtCreate === undefined || thresholdCurrencyAtCreate.trim().length === 0) {
    throw new Error('Root bucket preferred currency is required for threshold snapshot');
  }
  const rates = await getExchangeRates();
  const thresholdAmountMinorAtCreate = convertToBaselineMinorAmount(
    {
      amount: body.amount,
      currency: normalizedValue.currency,
      amountUnit: normalizedValue.amountUnit,
    },
    thresholdCurrencyAtCreate,
    rates
  );
  if (
    thresholdAmountMinorAtCreate === null ||
    !Number.isSafeInteger(thresholdAmountMinorAtCreate) ||
    thresholdAmountMinorAtCreate < 0 ||
    thresholdAmountMinorAtCreate > MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR
  ) {
    throw new Error('Unable to compute threshold snapshot for message value');
  }

  const podcastIndexFeedId =
    'podcast_index_feed_id' in body ? (body.podcast_index_feed_id ?? null) : null;

  if (body.action === 'stream') {
    await BucketMessageService.create({
      bucketId: targetBucketId,
      senderName: body.sender_name ?? body.app_name,
      body: null,
      currency: normalizedValue.currency,
      amount: body.amount,
      amountUnit: normalizedValue.amountUnit,
      thresholdCurrencyAtCreate,
      thresholdAmountMinorAtCreate,
      action: body.action,
      appName: body.app_name,
      appVersion: body.app_version ?? null,
      senderGuid: body.sender_guid,
      podcastIndexFeedId,
      timePosition: body.time_position ?? null,
    });
    return { streamResponse: true };
  }

  const storedMessage = await BucketMessageService.create({
    bucketId: targetBucketId,
    senderName: body.sender_name ?? body.app_name,
    body: body.message ?? null,
    currency: normalizedValue.currency,
    amount: body.amount,
    amountUnit: normalizedValue.amountUnit,
    thresholdCurrencyAtCreate,
    thresholdAmountMinorAtCreate,
    action: body.action,
    appName: body.app_name,
    appVersion: body.app_version ?? null,
    senderGuid: body.sender_guid,
    podcastIndexFeedId,
    timePosition: body.time_position ?? null,
  });

  return { streamResponse: false, messageGuid: storedMessage.id };
}
