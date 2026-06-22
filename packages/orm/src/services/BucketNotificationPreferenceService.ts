import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketNotificationPreference } from '../entities/BucketNotificationPreference.js';

function mapBucketNotificationPreferenceRow(raw: unknown): BucketNotificationPreference {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('BucketNotificationPreferenceService: invalid RETURNING row shape');
  }
  const id = Reflect.get(raw, 'id');
  const userId = Reflect.get(raw, 'userId');
  const bucketId = Reflect.get(raw, 'bucketId');
  const enabled = Reflect.get(raw, 'enabled');
  const createdAt = Reflect.get(raw, 'createdAt');
  const updatedAt = Reflect.get(raw, 'updatedAt');
  if (typeof id !== 'string') {
    throw new Error('BucketNotificationPreferenceService: invalid id');
  }
  if (typeof userId !== 'string') {
    throw new Error('BucketNotificationPreferenceService: invalid userId');
  }
  if (typeof bucketId !== 'string') {
    throw new Error('BucketNotificationPreferenceService: invalid bucketId');
  }
  if (typeof enabled !== 'boolean') {
    throw new Error('BucketNotificationPreferenceService: invalid enabled');
  }
  if (!(createdAt instanceof Date)) {
    throw new Error('BucketNotificationPreferenceService: invalid createdAt');
  }
  if (!(updatedAt instanceof Date)) {
    throw new Error('BucketNotificationPreferenceService: invalid updatedAt');
  }
  const entity = new BucketNotificationPreference();
  entity.id = id;
  entity.userId = userId;
  entity.bucketId = bucketId;
  entity.enabled = enabled;
  entity.createdAt = createdAt;
  entity.updatedAt = updatedAt;
  return entity;
}

export class BucketNotificationPreferenceService {
  static async findByUserAndBucket(
    userId: string,
    bucketId: string
  ): Promise<BucketNotificationPreference | null> {
    const repo = appDataSourceRead.getRepository(BucketNotificationPreference);
    return repo.findOne({ where: { userId, bucketId } });
  }

  static async upsert(
    userId: string,
    bucketId: string,
    enabled: boolean
  ): Promise<BucketNotificationPreference> {
    // Single round-trip; bypasses TypeORM repository hooks (none are defined on this entity).
    const rows: unknown[] = await appDataSourceReadWrite.query(
      `
        INSERT INTO bucket_notification_preference (user_id, bucket_id, enabled)
        VALUES ($1::uuid, $2::uuid, $3::boolean)
        ON CONFLICT (user_id, bucket_id) DO UPDATE SET
          enabled = EXCLUDED.enabled,
          updated_at = NOW()
        RETURNING
          id,
          user_id AS "userId",
          bucket_id AS "bucketId",
          enabled,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [userId, bucketId, enabled]
    );
    const first = rows[0];
    if (first === undefined) {
      throw new Error('BucketNotificationPreferenceService.upsert: row missing after upsert');
    }
    return mapBucketNotificationPreferenceRow(first);
  }

  /**
   * One SQL round-trip for many buckets (see BucketService.applyGeneralSettingsToDescendants).
   */
  static async upsertManyForUser(
    userId: string,
    bucketIds: string[],
    enabled: boolean
  ): Promise<void> {
    if (bucketIds.length === 0) {
      return;
    }
    await appDataSourceReadWrite.query(
      `
        INSERT INTO bucket_notification_preference
          (user_id, bucket_id, enabled, created_at, updated_at)
        SELECT $1::uuid, id, $2::boolean, NOW(), NOW()
          FROM bucket
         WHERE id = ANY($3::uuid[])
        ON CONFLICT (user_id, bucket_id)
           DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW();
      `,
      [userId, enabled, bucketIds]
    );
  }

  static async listByUser(userId: string): Promise<BucketNotificationPreference[]> {
    const repo = appDataSourceRead.getRepository(BucketNotificationPreference);
    return repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  static async listByBucket(bucketId: string): Promise<BucketNotificationPreference[]> {
    const repo = appDataSourceRead.getRepository(BucketNotificationPreference);
    return repo.find({
      where: { bucketId },
      order: { createdAt: 'ASC' },
    });
  }

  static async delete(userId: string, bucketId: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketNotificationPreference);
    await repo.delete({ userId, bucketId });
  }
}
