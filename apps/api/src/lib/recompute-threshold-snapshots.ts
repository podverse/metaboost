import { MAX_MINIMUM_MESSAGE_AMOUNT_MINOR } from '@metaboost/helpers';
import { BucketService, appDataSourceRead, appDataSourceReadWrite } from '@metaboost/orm';

import { convertToBaselineMinorAmount, getExchangeRates } from './exchangeRates.js';

type MessageThresholdSourceRow = {
  bucketMessageId: string;
  currency: string;
  amount: string;
  amountUnit: string | null;
};

type MessageThresholdSnapshotUpdate = {
  bucketMessageId: string;
  thresholdCurrencyAtCreate: string;
  thresholdAmountMinorAtCreate: number;
};

export async function recomputeRootThresholdSnapshots(
  rootBucketId: string,
  preferredCurrency: string
): Promise<void> {
  const descendantIds = await BucketService.findDescendantIds(rootBucketId);
  const scopedBucketIds = [rootBucketId, ...descendantIds];
  if (scopedBucketIds.length === 0) {
    return;
  }
  const sourceRows = await appDataSourceRead.query<MessageThresholdSourceRow[]>(
    `
      SELECT
        value.bucket_message_id AS "bucketMessageId",
        value.currency AS "currency",
        value.amount AS "amount",
        value.amount_unit AS "amountUnit"
      FROM bucket_message_value value
      INNER JOIN bucket_message msg ON msg.id = value.bucket_message_id
      WHERE msg.bucket_id = ANY($1::uuid[])
    `,
    [scopedBucketIds]
  );
  if (sourceRows.length === 0) {
    return;
  }
  const rates = await getExchangeRates();
  const updates: MessageThresholdSnapshotUpdate[] = sourceRows.map((row) => {
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) {
      throw new Error(
        `Invalid message amount "${row.amount}" for bucket_message_id ${row.bucketMessageId}`
      );
    }
    const convertedMinor = convertToBaselineMinorAmount(
      {
        amount,
        currency: row.currency,
        amountUnit: row.amountUnit,
      },
      preferredCurrency,
      rates
    );
    if (
      convertedMinor === null ||
      !Number.isSafeInteger(convertedMinor) ||
      convertedMinor < 0 ||
      convertedMinor > MAX_MINIMUM_MESSAGE_AMOUNT_MINOR
    ) {
      throw new Error(
        `Unable to convert message ${row.bucketMessageId} to preferred currency ${preferredCurrency}`
      );
    }
    return {
      bucketMessageId: row.bucketMessageId,
      thresholdCurrencyAtCreate: preferredCurrency,
      thresholdAmountMinorAtCreate: convertedMinor,
    };
  });
  await appDataSourceReadWrite.transaction(async (manager) => {
    for (const update of updates) {
      await manager.query(
        `
          UPDATE bucket_message_value
          SET
            threshold_currency_at_create = $2,
            threshold_amount_minor_at_create = $3
          WHERE bucket_message_id = $1
        `,
        [
          update.bucketMessageId,
          update.thresholdCurrencyAtCreate,
          update.thresholdAmountMinorAtCreate,
        ]
      );
    }
  });
}
