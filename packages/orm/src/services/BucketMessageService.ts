import type { MbrssV1ActionValue } from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketMessage } from '../entities/BucketMessage.js';
import { BucketMessageAppMeta } from '../entities/BucketMessageAppMeta.js';
import { BucketMessageValue } from '../entities/BucketMessageValue.js';

export class BucketMessageService {
  private static hydrateMessage(message: BucketMessage): BucketMessage {
    const appMeta = message.appMeta;

    message.appName = appMeta?.appName ?? 'Unknown App';
    message.appVersion = appMeta?.appVersion ?? null;
    message.senderId = appMeta?.senderId ?? null;
    message.podcastIndexFeedId = appMeta?.podcastIndexFeedId ?? null;
    message.timePosition = appMeta?.timePosition ?? null;
    message.currency = message.value?.currency ?? '';
    message.amount = message.value?.amount ?? '0';
    message.amountUnit = message.value?.amountUnit ?? null;

    message.appMeta = undefined;
    message.value = undefined;

    return message;
  }

  static async findById(
    id: string,
    options: { actions?: MbrssV1ActionValue[] } = {}
  ): Promise<BucketMessage | null> {
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const { actions } = options;
    const qb = repo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.appMeta', 'appMeta')
      .leftJoinAndSelect('msg.value', 'value')
      .where('msg.id = :id', { id });
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    const message = await qb.getOne();
    if (message === null) {
      return null;
    }
    return BucketMessageService.hydrateMessage(message);
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
      actions?: MbrssV1ActionValue[];
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
      actions?: MbrssV1ActionValue[];
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<BucketMessage[]> {
    if (bucketIds.length === 0) {
      return [];
    }
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const { limit = 50, offset = 0, publicOnly = false, actions, order = 'DESC' } = options;
    const qb = repo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.appMeta', 'appMeta')
      .leftJoinAndSelect('msg.value', 'value')
      .where('msg.bucket_id IN (:...bucketIds)', { bucketIds })
      .orderBy('msg.createdAt', order)
      .take(limit)
      .skip(offset);
    if (publicOnly) {
      qb.andWhere('msg.is_public = true');
    }
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    const messages = await qb.getMany();
    return messages.map((message) => BucketMessageService.hydrateMessage(message));
  }

  static async countByBucketId(
    bucketId: string,
    options: {
      publicOnly?: boolean;
      actions?: MbrssV1ActionValue[];
    } = {}
  ): Promise<number> {
    return BucketMessageService.countByBucketIds([bucketId], options);
  }

  static async countByBucketIds(
    bucketIds: string[],
    options: {
      publicOnly?: boolean;
      actions?: MbrssV1ActionValue[];
    } = {}
  ): Promise<number> {
    if (bucketIds.length === 0) {
      return 0;
    }
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const { publicOnly = false, actions } = options;
    const qb = repo
      .createQueryBuilder('msg')
      .where('msg.bucket_id IN (:...bucketIds)', { bucketIds });
    if (publicOnly) {
      qb.andWhere('msg.is_public = true');
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
    isPublic?: boolean;
  }): Promise<BucketMessage> {
    return appDataSourceReadWrite.transaction(async (manager) => {
      const messageRepo = manager.getRepository(BucketMessage);
      const appMetaRepo = manager.getRepository(BucketMessageAppMeta);
      const valueRepo = manager.getRepository(BucketMessageValue);

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
      const hydratedMessage = await messageRepo
        .createQueryBuilder('msg')
        .leftJoinAndSelect('msg.appMeta', 'appMeta')
        .leftJoinAndSelect('msg.value', 'value')
        .where('msg.id = :id', { id: message.id })
        .getOne();

      if (hydratedMessage === null) {
        return message;
      }

      return BucketMessageService.hydrateMessage(hydratedMessage);
    });
  }

  static async delete(id: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketMessage);
    await repo.delete(id);
  }
}
