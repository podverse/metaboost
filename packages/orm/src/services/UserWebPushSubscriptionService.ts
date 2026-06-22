import { In } from 'typeorm';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { UserWebPushSubscription } from '../entities/UserWebPushSubscription.js';

function mapUserWebPushSubscriptionRow(raw: unknown): UserWebPushSubscription {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('UserWebPushSubscriptionService: invalid RETURNING row shape');
  }
  const id = Reflect.get(raw, 'id');
  const userId = Reflect.get(raw, 'userId');
  const endpoint = Reflect.get(raw, 'endpoint');
  const keyP256dh = Reflect.get(raw, 'keyP256dh');
  const keyAuth = Reflect.get(raw, 'keyAuth');
  const locale = Reflect.get(raw, 'locale');
  const createdAt = Reflect.get(raw, 'createdAt');
  const updatedAt = Reflect.get(raw, 'updatedAt');
  if (typeof id !== 'string') {
    throw new Error('UserWebPushSubscriptionService: invalid id');
  }
  if (typeof userId !== 'string') {
    throw new Error('UserWebPushSubscriptionService: invalid userId');
  }
  if (typeof endpoint !== 'string') {
    throw new Error('UserWebPushSubscriptionService: invalid endpoint');
  }
  if (typeof keyP256dh !== 'string') {
    throw new Error('UserWebPushSubscriptionService: invalid keyP256dh');
  }
  if (typeof keyAuth !== 'string') {
    throw new Error('UserWebPushSubscriptionService: invalid keyAuth');
  }
  if (locale !== null && typeof locale !== 'string') {
    throw new Error('UserWebPushSubscriptionService: invalid locale');
  }
  if (!(createdAt instanceof Date)) {
    throw new Error('UserWebPushSubscriptionService: invalid createdAt');
  }
  if (!(updatedAt instanceof Date)) {
    throw new Error('UserWebPushSubscriptionService: invalid updatedAt');
  }
  const entity = new UserWebPushSubscription();
  entity.id = id;
  entity.userId = userId;
  entity.endpoint = endpoint;
  entity.keyP256dh = keyP256dh;
  entity.keyAuth = keyAuth;
  entity.locale = locale;
  entity.createdAt = createdAt;
  entity.updatedAt = updatedAt;
  return entity;
}

export class UserWebPushSubscriptionService {
  static async upsert(data: {
    userId: string;
    endpoint: string;
    keyP256dh: string;
    keyAuth: string;
    locale?: string | null;
  }): Promise<UserWebPushSubscription> {
    // Single round-trip; bypasses TypeORM repository hooks (none are defined on this entity).
    const rows: unknown[] = await appDataSourceReadWrite.query(
      `
        INSERT INTO user_web_push_subscription (user_id, endpoint, key_p256dh, key_auth, locale)
        VALUES ($1::uuid, $2::text, $3::text, $4::text, $5)
        ON CONFLICT (endpoint) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          key_p256dh = EXCLUDED.key_p256dh,
          key_auth = EXCLUDED.key_auth,
          locale = EXCLUDED.locale,
          updated_at = NOW()
        RETURNING
          id,
          user_id AS "userId",
          endpoint,
          key_p256dh AS "keyP256dh",
          key_auth AS "keyAuth",
          locale,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [data.userId, data.endpoint, data.keyP256dh, data.keyAuth, data.locale ?? null]
    );
    const first = rows[0];
    if (first === undefined) {
      throw new Error('UserWebPushSubscriptionService.upsert: row missing after upsert');
    }
    return mapUserWebPushSubscriptionRow(first);
  }

  static async findByIdForUser(
    id: string,
    userId: string
  ): Promise<UserWebPushSubscription | null> {
    const repo = appDataSourceRead.getRepository(UserWebPushSubscription);
    return repo.findOne({ where: { id, userId } });
  }

  static async updateForUser(
    id: string,
    userId: string,
    data: {
      endpoint?: string;
      keyP256dh?: string;
      keyAuth?: string;
      locale?: string | null;
    }
  ): Promise<UserWebPushSubscription | null> {
    const repo = appDataSourceReadWrite.getRepository(UserWebPushSubscription);
    const existing = await repo.findOne({ where: { id, userId } });
    if (existing === null) {
      return null;
    }
    if (data.endpoint !== undefined) {
      existing.endpoint = data.endpoint;
    }
    if (data.keyP256dh !== undefined) {
      existing.keyP256dh = data.keyP256dh;
    }
    if (data.keyAuth !== undefined) {
      existing.keyAuth = data.keyAuth;
    }
    if (data.locale !== undefined) {
      existing.locale = data.locale;
    }
    return repo.save(existing);
  }

  static async listByUser(userId: string): Promise<UserWebPushSubscription[]> {
    const repo = appDataSourceRead.getRepository(UserWebPushSubscription);
    return repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  /** Single round-trip for dispatch; ordered by user then subscription age for stable grouping. */
  static async listByUserIds(userIds: string[]): Promise<UserWebPushSubscription[]> {
    if (userIds.length === 0) {
      return [];
    }
    const repo = appDataSourceRead.getRepository(UserWebPushSubscription);
    return repo.find({
      where: { userId: In(userIds) },
      order: { userId: 'ASC', createdAt: 'ASC' },
    });
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const repo = appDataSourceReadWrite.getRepository(UserWebPushSubscription);
    const result = await repo.delete({ id, userId });
    const affected = result.affected;
    return affected !== undefined && affected !== null && affected > 0;
  }
}
