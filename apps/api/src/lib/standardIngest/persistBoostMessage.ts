import type { CreateMbrssV1BoostBody } from '../../schemas/mbrssV1.js';
import type { CreateMbV1BoostBody } from '../../schemas/mbV1.js';

import { BucketMessageService } from '@metaboost/orm';

import { convertToBaselineAmount, getExchangeRates } from '../exchangeRates.js';

type NormalizedCurrency = { currency: string; amountUnit: string | null };

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
  const INT32_MAX = 2_147_483_647;
  let usdCentsAtCreate: number | null = null;

  const podcastIndexFeedId =
    'podcast_index_feed_id' in body ? (body.podcast_index_feed_id ?? null) : null;

  try {
    const rates = await getExchangeRates();
    const usdAmount = convertToBaselineAmount(
      {
        amount: body.amount,
        currency: normalizedValue.currency,
        amountUnit: normalizedValue.amountUnit,
      },
      'USD',
      rates
    );
    if (usdAmount !== null) {
      const roundedUsdCents = Math.round(usdAmount * 100);
      if (
        Number.isSafeInteger(roundedUsdCents) &&
        roundedUsdCents >= 0 &&
        roundedUsdCents <= INT32_MAX
      ) {
        usdCentsAtCreate = roundedUsdCents;
      }
    }
  } catch {
    //
  }

  if (body.action === 'stream') {
    await BucketMessageService.create({
      bucketId: targetBucketId,
      senderName: body.sender_name ?? body.app_name,
      body: null,
      currency: normalizedValue.currency,
      amount: body.amount,
      amountUnit: normalizedValue.amountUnit,
      usdCentsAtCreate,
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
    usdCentsAtCreate,
    action: body.action,
    appName: body.app_name,
    appVersion: body.app_version ?? null,
    senderGuid: body.sender_guid,
    podcastIndexFeedId,
    timePosition: body.time_position ?? null,
  });

  return { streamResponse: false, messageGuid: storedMessage.id };
}
