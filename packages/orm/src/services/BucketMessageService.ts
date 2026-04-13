import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketMessage } from '../entities/BucketMessage.js';

export type BucketMessageAction = 'boost' | 'stream';

export class BucketMessageService {
  static async findById(
    id: string,
    options: { actions?: BucketMessageAction[] } = {}
  ): Promise<BucketMessage | null> {
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const { actions } = options;
    const qb = repo.createQueryBuilder('msg').where('msg.id = :id', { id });
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    return qb.getOne();
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
      actions?: BucketMessageAction[];
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<BucketMessage[]> {
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const {
      limit = 50,
      offset = 0,
      publicOnly = false,
      verifiedOnly = false,
      actions,
      order = 'DESC',
    } = options;
    const qb = repo
      .createQueryBuilder('msg')
      .where('msg.bucket_id = :bucketId', { bucketId })
      .orderBy('msg.created_at', order)
      .take(limit)
      .skip(offset);
    if (publicOnly) {
      qb.andWhere('msg.is_public = true');
    }
    if (verifiedOnly) {
      qb.andWhere('msg.payment_verified_by_app = true');
    }
    if (actions !== undefined && actions.length > 0) {
      qb.andWhere('msg.action IN (:...actions)', { actions });
    }
    return qb.getMany();
  }

  static async countByBucketId(
    bucketId: string,
    publicOnly?: boolean,
    verifiedOnly?: boolean,
    actions?: BucketMessageAction[]
  ): Promise<number> {
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const qb = repo.createQueryBuilder('msg').where('msg.bucket_id = :bucketId', { bucketId });
    if (publicOnly === true) {
      qb.andWhere('msg.is_public = true');
    }
    if (verifiedOnly === true) {
      qb.andWhere('msg.payment_verified_by_app = true');
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
    senderName: string;
    body: string;
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
    isPublic?: boolean;
  }): Promise<BucketMessage> {
    const repo = appDataSourceReadWrite.getRepository(BucketMessage);
    const msg = repo.create({
      bucketId: data.bucketId,
      senderName: data.senderName,
      body: data.body,
      currency: data.currency,
      amount: String(data.amount),
      amountUnit: data.amountUnit ?? null,
      action: data.action,
      appName: data.appName,
      appVersion: data.appVersion ?? null,
      senderId: data.senderId ?? null,
      podcastIndexFeedId: data.podcastIndexFeedId ?? null,
      timePosition:
        data.timePosition !== undefined && data.timePosition !== null
          ? String(data.timePosition)
          : null,
      paymentVerifiedByApp: data.paymentVerifiedByApp ?? false,
      isPublic: data.isPublic ?? false,
    });
    return repo.save(msg);
  }

  static async update(
    id: string,
    data: { body?: string; isPublic?: boolean; paymentVerifiedByApp?: boolean }
  ): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketMessage);
    const update: Partial<Pick<BucketMessage, 'body' | 'isPublic' | 'paymentVerifiedByApp'>> = {};
    if (data.body !== undefined) update.body = data.body;
    if (data.isPublic !== undefined) update.isPublic = data.isPublic;
    if (data.paymentVerifiedByApp !== undefined) {
      update.paymentVerifiedByApp = data.paymentVerifiedByApp;
    }
    if (Object.keys(update).length > 0) {
      await repo.update(id, update);
    }
  }

  static async delete(id: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketMessage);
    await repo.delete(id);
  }
}
