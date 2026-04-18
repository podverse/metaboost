import type { MbrssV1ActionValue } from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketMessage } from '../entities/BucketMessage.js';
import { BucketMessageAppMeta } from '../entities/BucketMessageAppMeta.js';
import { BucketMessageValue } from '../entities/BucketMessageValue.js';

export class BucketMessageService {
  static readonly SUMMARY_TIME_BUCKETS = ['hour', 'day', 'month'] as const;

  static isSummaryTimeBucket(
    value: string
  ): value is (typeof BucketMessageService.SUMMARY_TIME_BUCKETS)[number] {
    return (BucketMessageService.SUMMARY_TIME_BUCKETS as readonly string[]).includes(value);
  }

  private static hydrateMessage(message: BucketMessage): BucketMessage {
    const appMeta = message.appMeta;

    message.appName = appMeta?.appName ?? 'Unknown App';
    message.appVersion = appMeta?.appVersion ?? null;
    message.senderGuid = appMeta?.senderGuid ?? null;
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
   * With publicOnly, only include messages in buckets where is_public is true.
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
      qb.innerJoin('msg.bucket', 'msgBucket');
      qb.andWhere('msgBucket.is_public = :pub', { pub: true });
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
      qb.innerJoin('msg.bucket', 'msgBucket');
      qb.andWhere('msgBucket.is_public = :pub', { pub: true });
    }
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    return qb.getCount();
  }

  static async summarizeTotalsByBucketIds(
    bucketIds: string[],
    options: {
      from?: Date;
      to?: Date;
      publicOnly?: boolean;
      actions?: MbrssV1ActionValue[];
    } = {}
  ): Promise<
    Array<{
      currency: string | null;
      amountUnit: string | null;
      totalAmount: string;
      messageCount: number;
    }>
  > {
    if (bucketIds.length === 0) {
      return [];
    }
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const { from, to, publicOnly = false, actions } = options;
    const qb = repo
      .createQueryBuilder('msg')
      .leftJoin(BucketMessageValue, 'value', 'value.bucket_message_id = msg.id')
      .select('value.currency', 'currency')
      .addSelect('value.amount_unit', 'amountUnit')
      .addSelect(
        "COALESCE(SUM(CASE WHEN value.amount IS NULL OR value.amount = '' THEN 0 ELSE value.amount::numeric END), 0)",
        'totalAmount'
      )
      .addSelect('COUNT(*)::int', 'messageCount')
      .where('msg.bucket_id IN (:...bucketIds)', { bucketIds })
      .groupBy('value.currency')
      .addGroupBy('value.amount_unit');
    if (publicOnly) {
      qb.innerJoin('msg.bucket', 'msgBucket');
      qb.andWhere('msgBucket.is_public = :pub', { pub: true });
    }
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    if (from !== undefined) {
      qb.andWhere('msg.created_at >= :from', { from: from.toISOString() });
    }
    if (to !== undefined) {
      qb.andWhere('msg.created_at <= :to', { to: to.toISOString() });
    }
    const rows = await qb.getRawMany<{
      currency: string | null;
      amountUnit: string | null;
      totalAmount: string;
      messageCount: string | number;
    }>();
    return rows.map((row) => ({
      currency: row.currency ?? null,
      amountUnit: row.amountUnit ?? null,
      totalAmount: row.totalAmount,
      messageCount:
        typeof row.messageCount === 'string'
          ? Number.parseInt(row.messageCount, 10)
          : Number(row.messageCount),
    }));
  }

  static async summarizeTimeSeriesByBucketIds(
    bucketIds: string[],
    options: {
      from?: Date;
      to?: Date;
      timeBucket: 'hour' | 'day' | 'month';
      publicOnly?: boolean;
      actions?: MbrssV1ActionValue[];
    }
  ): Promise<
    Array<{
      bucketStart: Date;
      currency: string | null;
      amountUnit: string | null;
      totalAmount: string;
      messageCount: number;
    }>
  > {
    if (bucketIds.length === 0) {
      return [];
    }
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const { from, to, timeBucket, publicOnly = false, actions } = options;
    const bucketExpression = `date_trunc('${timeBucket}', msg.created_at)`;
    const qb = repo
      .createQueryBuilder('msg')
      .leftJoin(BucketMessageValue, 'value', 'value.bucket_message_id = msg.id')
      .select(bucketExpression, 'bucketStart')
      .addSelect('value.currency', 'currency')
      .addSelect('value.amount_unit', 'amountUnit')
      .addSelect(
        "COALESCE(SUM(CASE WHEN value.amount IS NULL OR value.amount = '' THEN 0 ELSE value.amount::numeric END), 0)",
        'totalAmount'
      )
      .addSelect('COUNT(*)::int', 'messageCount')
      .where('msg.bucket_id IN (:...bucketIds)', { bucketIds })
      .groupBy(bucketExpression)
      .addGroupBy('value.currency')
      .addGroupBy('value.amount_unit')
      .orderBy(bucketExpression, 'ASC');
    if (publicOnly) {
      qb.innerJoin('msg.bucket', 'msgBucket');
      qb.andWhere('msgBucket.is_public = :pub', { pub: true });
    }
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    if (from !== undefined) {
      qb.andWhere('msg.created_at >= :from', { from: from.toISOString() });
    }
    if (to !== undefined) {
      qb.andWhere('msg.created_at <= :to', { to: to.toISOString() });
    }
    const rows = await qb.getRawMany<{
      bucketStart: Date | string;
      currency: string | null;
      amountUnit: string | null;
      totalAmount: string;
      messageCount: string | number;
    }>();
    return rows.map((row) => ({
      bucketStart: row.bucketStart instanceof Date ? row.bucketStart : new Date(row.bucketStart),
      currency: row.currency ?? null,
      amountUnit: row.amountUnit ?? null,
      totalAmount: row.totalAmount,
      messageCount:
        typeof row.messageCount === 'string'
          ? Number.parseInt(row.messageCount, 10)
          : Number(row.messageCount),
    }));
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
    senderGuid?: string | null;
    podcastIndexFeedId?: number | null;
    timePosition?: number | null;
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
          senderGuid: data.senderGuid ?? null,
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
