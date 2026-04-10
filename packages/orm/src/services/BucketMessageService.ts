import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketMessage } from '../entities/BucketMessage.js';

export class BucketMessageService {
  static async findById(id: string): Promise<BucketMessage | null> {
    const repo = appDataSourceRead.getRepository(BucketMessage);
    return repo.findOne({ where: { id } });
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
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<BucketMessage[]> {
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const { limit = 50, offset = 0, publicOnly = false, order = 'DESC' } = options;
    const qb = repo
      .createQueryBuilder('msg')
      .where('msg.bucket_id = :bucketId', { bucketId })
      .orderBy('msg.created_at', order)
      .take(limit)
      .skip(offset);
    if (publicOnly) {
      qb.andWhere('msg.is_public = true');
    }
    return qb.getMany();
  }

  static async countByBucketId(bucketId: string, publicOnly?: boolean): Promise<number> {
    const repo = appDataSourceRead.getRepository(BucketMessage);
    const qb = repo.createQueryBuilder('msg').where('msg.bucket_id = :bucketId', { bucketId });
    if (publicOnly === true) {
      qb.andWhere('msg.is_public = true');
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
    isPublic?: boolean;
  }): Promise<BucketMessage> {
    const repo = appDataSourceReadWrite.getRepository(BucketMessage);
    const msg = repo.create({
      bucketId: data.bucketId,
      senderName: data.senderName,
      body: data.body,
      isPublic: data.isPublic ?? false,
    });
    return repo.save(msg);
  }

  static async update(id: string, data: { body?: string; isPublic?: boolean }): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketMessage);
    const update: Partial<Pick<BucketMessage, 'body' | 'isPublic'>> = {};
    if (data.body !== undefined) update.body = data.body;
    if (data.isPublic !== undefined) update.isPublic = data.isPublic;
    if (Object.keys(update).length > 0) {
      await repo.update(id, update);
    }
  }

  static async delete(id: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketMessage);
    await repo.delete(id);
  }
}
