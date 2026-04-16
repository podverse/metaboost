import type {
  BucketMessageRecipientOutcome,
  Mb1PaymentVerificationLevel,
} from '../entities/BucketMessage.js';
import type { Mb1PaymentRecipientStatus } from '../entities/BucketMessage.js';
import type { Mb1ActionValue } from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketMessage } from '../entities/BucketMessage.js';
import { BucketMessageAppMeta } from '../entities/BucketMessageAppMeta.js';
import { BucketMessagePaymentVerification } from '../entities/BucketMessagePaymentVerification.js';
import { BucketMessageRecipientOutcomeEntity } from '../entities/BucketMessageRecipientOutcome.js';
import { BucketMessageValue } from '../entities/BucketMessageValue.js';

const MB1_PAYMENT_VERIFICATION_LEVEL_RANK: Record<Mb1PaymentVerificationLevel, number> = {
  'fully-verified': 4,
  'verified-largest-recipient-succeeded': 3,
  'partially-verified': 2,
  'not-verified': 1,
};

const getVerificationLevelsAtOrAbove = (
  threshold: Mb1PaymentVerificationLevel
): Mb1PaymentVerificationLevel[] => {
  const thresholdRank = MB1_PAYMENT_VERIFICATION_LEVEL_RANK[threshold];
  return (Object.keys(MB1_PAYMENT_VERIFICATION_LEVEL_RANK) as Mb1PaymentVerificationLevel[]).filter(
    (level) => MB1_PAYMENT_VERIFICATION_LEVEL_RANK[level] >= thresholdRank
  );
};

export class BucketMessageService {
  private static mapRecipientOutcomes(
    outcomeEntities: BucketMessageRecipientOutcomeEntity[]
  ): BucketMessageRecipientOutcome[] {
    return outcomeEntities.map((outcomeEntity) => ({
      type: outcomeEntity.recipientType,
      address: outcomeEntity.address,
      split: Number(outcomeEntity.split),
      name: outcomeEntity.name,
      custom_key: outcomeEntity.customKey,
      custom_value: outcomeEntity.customValue,
      fee: outcomeEntity.fee,
      status: outcomeEntity.status,
    }));
  }

  private static hydrateMessage(
    message: BucketMessage,
    outcomeEntities: BucketMessageRecipientOutcomeEntity[]
  ): BucketMessage {
    const paymentVerification = message.paymentVerification;
    const appMeta = message.appMeta;

    message.appName = appMeta?.appName ?? 'Unknown App';
    message.appVersion = appMeta?.appVersion ?? null;
    message.senderId = appMeta?.senderId ?? null;
    message.podcastIndexFeedId = appMeta?.podcastIndexFeedId ?? null;
    message.timePosition = appMeta?.timePosition ?? null;

    message.paymentVerifiedByApp = paymentVerification?.verifiedByApp ?? false;
    message.paymentVerificationLevel = paymentVerification?.verificationLevel ?? 'not-verified';
    message.paymentRecipientVerifiedCount = paymentVerification?.recipientVerifiedCount ?? 0;
    message.paymentRecipientFailedCount = paymentVerification?.recipientFailedCount ?? 0;
    message.paymentRecipientUndeterminedCount =
      paymentVerification?.recipientUndeterminedCount ?? 0;
    message.paymentRecipientOutcomes = BucketMessageService.mapRecipientOutcomes(outcomeEntities);
    message.currency = message.value?.currency ?? '';
    message.amount = message.value?.amount ?? '0';
    message.amountUnit = message.value?.amountUnit ?? null;

    message.appMeta = undefined;
    message.value = undefined;
    message.paymentVerification = undefined;
    message.recipientOutcomeEntities = undefined;

    return message;
  }

  private static async findRecipientOutcomeEntitiesByMessageIds(
    messageIds: string[]
  ): Promise<Map<string, BucketMessageRecipientOutcomeEntity[]>> {
    const outcomesByMessageId = new Map<string, BucketMessageRecipientOutcomeEntity[]>();
    if (messageIds.length === 0) {
      return outcomesByMessageId;
    }

    const outcomeRepo = appDataSourceRead.getRepository(BucketMessageRecipientOutcomeEntity);
    const outcomeEntities = await outcomeRepo
      .createQueryBuilder('outcome')
      .where('outcome.bucket_message_id IN (:...messageIds)', { messageIds })
      .orderBy('outcome.bucket_message_id', 'ASC')
      .addOrderBy('outcome.recipient_order', 'ASC')
      .getMany();

    for (const outcomeEntity of outcomeEntities) {
      const existing = outcomesByMessageId.get(outcomeEntity.bucketMessageId) ?? [];
      existing.push(outcomeEntity);
      outcomesByMessageId.set(outcomeEntity.bucketMessageId, existing);
    }

    return outcomesByMessageId;
  }

  static async findById(
    id: string,
    options: { actions?: Mb1ActionValue[] } = {}
  ): Promise<BucketMessage | null> {
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const { actions } = options;
    const qb = repo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.appMeta', 'appMeta')
      .leftJoinAndSelect('msg.value', 'value')
      .leftJoinAndSelect('msg.paymentVerification', 'paymentVerification')
      .where('msg.id = :id', { id });
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    const message = await qb.getOne();
    if (message === null) {
      return null;
    }

    const outcomesByMessageId = await BucketMessageService.findRecipientOutcomeEntitiesByMessageIds(
      [message.id]
    );
    return BucketMessageService.hydrateMessage(message, outcomesByMessageId.get(message.id) ?? []);
  }

  /**
   * List messages in a bucket with optional pagination.
   * When publicOnly is true, only rows with is_public = true are returned.
   * order: 'DESC' = recent first (default), 'ASC' = oldest first.
   */
  static async findByBucketId(
    bucketId: string,
    options: {
      limit?: number;
      offset?: number;
      publicOnly?: boolean;
      verifiedOnly?: boolean;
      verificationThreshold?: Mb1PaymentVerificationLevel;
      actions?: Mb1ActionValue[];
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<BucketMessage[]> {
    return BucketMessageService.findByBucketIds([bucketId], options);
  }

  static async findByBucketIds(
    bucketIds: string[],
    options: {
      limit?: number;
      offset?: number;
      publicOnly?: boolean;
      verifiedOnly?: boolean;
      verificationThreshold?: Mb1PaymentVerificationLevel;
      actions?: Mb1ActionValue[];
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<BucketMessage[]> {
    if (bucketIds.length === 0) {
      return [];
    }
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const {
      limit = 50,
      offset = 0,
      publicOnly = false,
      verifiedOnly = false,
      verificationThreshold,
      actions,
      order = 'DESC',
    } = options;
    const qb = repo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.appMeta', 'appMeta')
      .leftJoinAndSelect('msg.value', 'value')
      .leftJoinAndSelect('msg.paymentVerification', 'paymentVerification')
      .where('msg.bucket_id IN (:...bucketIds)', { bucketIds })
      .orderBy('msg.createdAt', order)
      .take(limit)
      .skip(offset);
    if (publicOnly) {
      qb.andWhere('msg.is_public = true');
    }
    if (verificationThreshold !== undefined) {
      const levels = getVerificationLevelsAtOrAbove(verificationThreshold);
      qb.andWhere(
        "COALESCE(paymentVerification.verification_level, 'not-verified') IN (:...verificationLevels)",
        {
          verificationLevels: levels,
        }
      );
    } else if (verifiedOnly) {
      qb.andWhere('COALESCE(paymentVerification.verified_by_app, false) = true');
    }
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    const messages = await qb.getMany();
    const messageIds = messages.map((message) => message.id);
    const outcomesByMessageId =
      await BucketMessageService.findRecipientOutcomeEntitiesByMessageIds(messageIds);

    return messages.map((message) =>
      BucketMessageService.hydrateMessage(message, outcomesByMessageId.get(message.id) ?? [])
    );
  }

  static async countByBucketId(
    bucketId: string,
    options: {
      publicOnly?: boolean;
      verifiedOnly?: boolean;
      verificationThreshold?: Mb1PaymentVerificationLevel;
      actions?: Mb1ActionValue[];
    } = {}
  ): Promise<number> {
    return BucketMessageService.countByBucketIds([bucketId], options);
  }

  static async countByBucketIds(
    bucketIds: string[],
    options: {
      publicOnly?: boolean;
      verifiedOnly?: boolean;
      verificationThreshold?: Mb1PaymentVerificationLevel;
      actions?: Mb1ActionValue[];
    } = {}
  ): Promise<number> {
    if (bucketIds.length === 0) {
      return 0;
    }
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const { publicOnly = false, verifiedOnly = false, verificationThreshold, actions } = options;
    const qb = repo
      .createQueryBuilder('msg')
      .leftJoin('msg.paymentVerification', 'paymentVerification')
      .where('msg.bucket_id IN (:...bucketIds)', { bucketIds });
    if (publicOnly) {
      qb.andWhere('msg.is_public = true');
    }
    if (verificationThreshold !== undefined) {
      const levels = getVerificationLevelsAtOrAbove(verificationThreshold);
      qb.andWhere(
        "COALESCE(paymentVerification.verification_level, 'not-verified') IN (:...verificationLevels)",
        {
          verificationLevels: levels,
        }
      );
    } else if (verifiedOnly) {
      qb.andWhere('COALESCE(paymentVerification.verified_by_app, false) = true');
    }
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    return qb.getCount();
  }

  /**
   * Returns the latest message createdAt per bucket for the given bucket IDs.
   * Only buckets that have at least one message are included.
   */
  static async getLatestMessageCreatedAtByBucketIds(
    bucketIds: string[]
  ): Promise<Map<string, Date>> {
    if (bucketIds.length === 0) return new Map();
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const rows = await repo
      .createQueryBuilder('msg')
      .select('msg.bucket_id', 'bucketId')
      .addSelect('MAX(msg.created_at)', 'latest')
      .where('msg.bucket_id IN (:...ids)', { ids: bucketIds })
      .groupBy('msg.bucket_id')
      .getRawMany<{ bucketId: string; latest: string | Date }>();
    const map = new Map<string, Date>();
    for (const row of rows) {
      const date = typeof row.latest === 'string' ? new Date(row.latest) : row.latest;
      map.set(row.bucketId, date);
    }
    return map;
  }

  static async create(data: {
    bucketId: string;
    senderName?: string | null;
    body?: string | null;
    currency: string;
    amount: number;
    amountUnit?: string | null;
    action: string;
    appName: string;
    appVersion?: string | null;
    senderId?: string | null;
    podcastIndexFeedId?: number | null;
    timePosition?: number | null;
    paymentVerifiedByApp?: boolean;
    paymentVerificationLevel?: Mb1PaymentVerificationLevel;
    paymentRecipientOutcomes?: BucketMessageRecipientOutcome[];
    paymentRecipientVerifiedCount?: number;
    paymentRecipientFailedCount?: number;
    paymentRecipientUndeterminedCount?: number;
    isPublic?: boolean;
  }): Promise<BucketMessage> {
    return appDataSourceReadWrite.transaction(async (manager) => {
      const messageRepo = manager.getRepository(BucketMessage);
      const appMetaRepo = manager.getRepository(BucketMessageAppMeta);
      const valueRepo = manager.getRepository(BucketMessageValue);
      const paymentVerificationRepo = manager.getRepository(BucketMessagePaymentVerification);
      const recipientOutcomeRepo = manager.getRepository(BucketMessageRecipientOutcomeEntity);

      const message = await messageRepo.save(
        messageRepo.create({
          bucketId: data.bucketId,
          senderName: data.senderName ?? null,
          body: data.body ?? null,
          action: data.action,
          isPublic: data.isPublic ?? false,
        })
      );

      await valueRepo.save(
        valueRepo.create({
          bucketMessageId: message.id,
          currency: data.currency,
          amount: String(data.amount),
          amountUnit: data.amountUnit ?? null,
        })
      );

      await appMetaRepo.save(
        appMetaRepo.create({
          bucketMessageId: message.id,
          appName: data.appName,
          appVersion: data.appVersion ?? null,
          senderId: data.senderId ?? null,
          podcastIndexFeedId: data.podcastIndexFeedId ?? null,
          timePosition:
            data.timePosition !== undefined && data.timePosition !== null
              ? String(data.timePosition)
              : null,
        })
      );

      const verificationLevel = data.paymentVerificationLevel ?? 'not-verified';
      const verifiedByApp =
        data.paymentVerifiedByApp ??
        (verificationLevel === 'fully-verified' ||
          verificationLevel === 'verified-largest-recipient-succeeded');

      await paymentVerificationRepo.save(
        paymentVerificationRepo.create({
          bucketMessageId: message.id,
          verifiedByApp,
          verificationLevel,
          recipientVerifiedCount: data.paymentRecipientVerifiedCount ?? 0,
          recipientFailedCount: data.paymentRecipientFailedCount ?? 0,
          recipientUndeterminedCount: data.paymentRecipientUndeterminedCount ?? 0,
          largestRecipientStatus: 'undetermined',
        })
      );

      const recipientOutcomes = data.paymentRecipientOutcomes ?? [];
      if (recipientOutcomes.length > 0) {
        await recipientOutcomeRepo.save(
          recipientOutcomes.map((recipientOutcome, index) =>
            recipientOutcomeRepo.create({
              bucketMessageId: message.id,
              recipientOrder: index,
              recipientType: recipientOutcome.type,
              address: recipientOutcome.address,
              split: String(recipientOutcome.split),
              name: recipientOutcome.name,
              customKey: recipientOutcome.custom_key,
              customValue: recipientOutcome.custom_value,
              fee: recipientOutcome.fee,
              status: recipientOutcome.status,
            })
          )
        );
      }

      const outcomesByMessageId =
        await BucketMessageService.findRecipientOutcomeEntitiesByMessageIds([message.id]);
      const hydratedMessage = await messageRepo
        .createQueryBuilder('msg')
        .leftJoinAndSelect('msg.appMeta', 'appMeta')
        .leftJoinAndSelect('msg.value', 'value')
        .leftJoinAndSelect('msg.paymentVerification', 'paymentVerification')
        .where('msg.id = :id', { id: message.id })
        .getOne();

      if (hydratedMessage === null) {
        return message;
      }

      return BucketMessageService.hydrateMessage(
        hydratedMessage,
        outcomesByMessageId.get(hydratedMessage.id) ?? []
      );
    });
  }

  static async update(
    id: string,
    data: {
      paymentVerifiedByApp?: boolean;
      paymentVerificationLevel?: Mb1PaymentVerificationLevel;
      paymentRecipientOutcomes?: BucketMessageRecipientOutcome[];
      paymentRecipientVerifiedCount?: number;
      paymentRecipientFailedCount?: number;
      paymentRecipientUndeterminedCount?: number;
      largestRecipientStatus?: Mb1PaymentRecipientStatus;
    }
  ): Promise<void> {
    await appDataSourceReadWrite.transaction(async (manager) => {
      const paymentVerificationRepo = manager.getRepository(BucketMessagePaymentVerification);
      const recipientOutcomeRepo = manager.getRepository(BucketMessageRecipientOutcomeEntity);

      const hasVerificationUpdate =
        data.paymentVerifiedByApp !== undefined ||
        data.paymentVerificationLevel !== undefined ||
        data.paymentRecipientVerifiedCount !== undefined ||
        data.paymentRecipientFailedCount !== undefined ||
        data.paymentRecipientUndeterminedCount !== undefined ||
        data.largestRecipientStatus !== undefined ||
        data.paymentRecipientOutcomes !== undefined;

      if (!hasVerificationUpdate) {
        return;
      }

      const existingVerification = await paymentVerificationRepo.findOne({
        where: { bucketMessageId: id },
      });
      const fallbackVerificationLevel: Mb1PaymentVerificationLevel =
        existingVerification?.verificationLevel ?? 'not-verified';
      const fallbackVerifiedByApp =
        fallbackVerificationLevel === 'fully-verified' ||
        fallbackVerificationLevel === 'verified-largest-recipient-succeeded';

      await paymentVerificationRepo.save(
        paymentVerificationRepo.create({
          bucketMessageId: id,
          verifiedByApp:
            data.paymentVerifiedByApp ??
            existingVerification?.verifiedByApp ??
            fallbackVerifiedByApp,
          verificationLevel: data.paymentVerificationLevel ?? fallbackVerificationLevel,
          recipientVerifiedCount:
            data.paymentRecipientVerifiedCount ?? existingVerification?.recipientVerifiedCount ?? 0,
          recipientFailedCount:
            data.paymentRecipientFailedCount ?? existingVerification?.recipientFailedCount ?? 0,
          recipientUndeterminedCount:
            data.paymentRecipientUndeterminedCount ??
            existingVerification?.recipientUndeterminedCount ??
            0,
          largestRecipientStatus:
            data.largestRecipientStatus ??
            existingVerification?.largestRecipientStatus ??
            'undetermined',
        })
      );

      if (data.paymentRecipientOutcomes === undefined) {
        return;
      }

      await recipientOutcomeRepo.delete({ bucketMessageId: id });
      if (data.paymentRecipientOutcomes.length === 0) {
        return;
      }

      await recipientOutcomeRepo.save(
        data.paymentRecipientOutcomes.map((recipientOutcome, index) =>
          recipientOutcomeRepo.create({
            bucketMessageId: id,
            recipientOrder: index,
            recipientType: recipientOutcome.type,
            address: recipientOutcome.address,
            split: String(recipientOutcome.split),
            name: recipientOutcome.name,
            customKey: recipientOutcome.custom_key,
            customValue: recipientOutcome.custom_value,
            fee: recipientOutcome.fee,
            status: recipientOutcome.status,
          })
        )
      );
    });
  }

  static async delete(id: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketMessage);
    await repo.delete(id);
  }
}
