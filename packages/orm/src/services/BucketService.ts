import type { BucketType } from '../entities/Bucket.js';

import { Brackets } from 'typeorm';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH, generateShortId } from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { Bucket } from '../entities/Bucket.js';
import { BucketSettings } from '../entities/BucketSettings.js';

export class BucketService {
  private static readonly MIN_MESSAGE_BODY_MAX_LENGTH = 140;
  private static readonly MAX_MESSAGE_BODY_MAX_LENGTH = 2500;

  private static assertMessageBodyMaxLength(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < BucketService.MIN_MESSAGE_BODY_MAX_LENGTH ||
      value > BucketService.MAX_MESSAGE_BODY_MAX_LENGTH
    ) {
      throw new Error(
        `messageBodyMaxLength must be an integer between ${BucketService.MIN_MESSAGE_BODY_MAX_LENGTH} and ${BucketService.MAX_MESSAGE_BODY_MAX_LENGTH}`
      );
    }
  }

  static isAllowedChildType(parentType: BucketType, childType: BucketType): boolean {
    if (parentType === 'rss-network') {
      return childType === 'rss-channel';
    }
    return false;
  }

  static async findById(id: string): Promise<Bucket | null> {
    const repo = appDataSourceRead.getRepository(Bucket);
    return repo.findOne({ where: { id }, relations: ['settings'] });
  }

  static async findByShortId(shortId: string): Promise<Bucket | null> {
    const repo = appDataSourceRead.getRepository(Bucket);
    return repo.findOne({ where: { shortId }, relations: ['settings'] });
  }

  /**
   * List buckets where user is owner or has a bucket_admin row (any permission).
   * Optional search filters by bucket name (case-insensitive substring).
   */
  static async findAccessibleByUser(
    userId: string,
    options?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<Bucket[]> {
    const repo = appDataSourceRead.getRepository(Bucket);
    const orderBy =
      options?.sortBy !== undefined &&
      (BucketService.LIST_PAGINATED_SORT_FIELDS as readonly string[]).includes(options.sortBy)
        ? options.sortBy
        : 'name';
    const orderDir: 'ASC' | 'DESC' =
      options?.sortOrder === 'asc'
        ? 'ASC'
        : options?.sortOrder === 'desc'
          ? 'DESC'
          : orderBy === 'createdAt'
            ? 'DESC'
            : 'ASC';
    const qb = repo
      .createQueryBuilder('bucket')
      .leftJoinAndSelect('bucket.settings', 'settings')
      .leftJoin('bucket_admin', 'ba', 'ba.bucket_id = bucket.id AND ba.user_id = :userId', {
        userId,
      })
      .where('bucket.parent_bucket_id IS NULL')
      .andWhere(
        new Brackets((bq) => {
          bq.where('bucket.owner_id = :userId', { userId }).orWhere('ba.user_id IS NOT NULL');
        })
      )
      .setParameter('userId', userId);
    if (orderBy === 'name') {
      qb.addSelect('LOWER(bucket.name)', '_sort_name').orderBy('_sort_name', orderDir);
    } else {
      qb.orderBy(`bucket.${orderBy}`, orderDir);
    }
    const searchTrim = options?.search?.trim();
    if (searchTrim !== undefined && searchTrim !== '') {
      const escaped = searchTrim.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
      qb.andWhere("LOWER(bucket.name) LIKE LOWER(:search) ESCAPE '\\'", {
        search: `%${escaped}%`,
      });
    }
    return qb.getMany();
  }

  static async findChildren(parentBucketId: string): Promise<Bucket[]> {
    const repo = appDataSourceRead.getRepository(Bucket);
    return repo.find({
      where: { parentBucketId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns all descendant bucket IDs (children, grandchildren, etc.) for a root bucket.
   * The root bucket ID itself is not included.
   */
  static async findDescendantIds(rootBucketId: string): Promise<string[]> {
    const rows = await appDataSourceRead.query(
      `
        WITH RECURSIVE bucket_tree AS (
          SELECT id
          FROM bucket
          WHERE parent_bucket_id = $1
          UNION ALL
          SELECT b.id
          FROM bucket b
          INNER JOIN bucket_tree bt ON b.parent_bucket_id = bt.id
        )
        SELECT id
        FROM bucket_tree
      `,
      [rootBucketId]
    );
    return rows
      .map((row: { id?: string }) => row.id)
      .filter((id: string | undefined): id is string => typeof id === 'string');
  }

  /**
   * Return parent chain from root to immediate parent (not including the bucket itself).
   * Order: root first, then each ancestor, so index 0 is the root bucket.
   */
  static async findAncestry(bucketId: string): Promise<Bucket[]> {
    const bucket = await BucketService.findById(bucketId);
    if (bucket === null || bucket.parentBucketId === null) return [];
    const chain: Bucket[] = [];
    let parentId: string | null = bucket.parentBucketId;
    while (parentId !== null) {
      const parent = await BucketService.findById(parentId);
      if (parent === null) break;
      chain.push(parent);
      parentId = parent.parentBucketId;
    }
    chain.reverse();
    return chain;
  }

  /** Allowed sort fields for listPaginated (entity property names). */
  static readonly LIST_PAGINATED_SORT_FIELDS = ['name', 'createdAt', 'isPublic'] as const;

  /**
   * List all buckets with optional search (name) and pagination. For management API.
   */
  static async listPaginated(
    limit: number,
    offset: number,
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<{ buckets: Bucket[]; total: number }> {
    const repo = appDataSourceRead.getRepository(Bucket);
    const orderBy =
      sortBy !== undefined &&
      (BucketService.LIST_PAGINATED_SORT_FIELDS as readonly string[]).includes(sortBy)
        ? sortBy
        : 'name';
    const orderDir: 'ASC' | 'DESC' =
      sortOrder === 'asc'
        ? 'ASC'
        : sortOrder === 'desc'
          ? 'DESC'
          : orderBy === 'createdAt'
            ? 'DESC'
            : 'ASC';
    const qb = repo
      .createQueryBuilder('bucket')
      .leftJoinAndSelect('bucket.settings', 'settings')
      .where('bucket.parent_bucket_id IS NULL');
    const countQb = repo.createQueryBuilder('bucket').where('bucket.parent_bucket_id IS NULL');
    if (orderBy === 'name') {
      qb.addSelect('LOWER(bucket.name)', '_sort_name').orderBy('_sort_name', orderDir);
    } else {
      qb.orderBy(`bucket.${orderBy}`, orderDir);
    }
    const searchTrim = search?.trim();
    if (searchTrim !== undefined && searchTrim !== '') {
      const escaped = searchTrim.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
      const pattern = `%${escaped}%`;
      qb.andWhere("LOWER(bucket.name) LIKE LOWER(:search) ESCAPE '\\'", { search: pattern });
      countQb.andWhere("LOWER(bucket.name) LIKE LOWER(:search) ESCAPE '\\'", { search: pattern });
    }
    const [buckets, total] = await Promise.all([
      qb.take(limit).skip(offset).getMany(),
      countQb.getCount(),
    ]);
    return { buckets, total };
  }

  static async create(data: {
    ownerId: string;
    name: string;
    type?: BucketType;
    isPublic?: boolean;
    parentBucketId?: string | null;
  }): Promise<Bucket> {
    const repo = appDataSourceReadWrite.getRepository(Bucket);
    const settingsRepo = appDataSourceReadWrite.getRepository(BucketSettings);
    const parentBucketId = data.parentBucketId ?? null;
    let inheritedIsPublic = data.isPublic ?? true;
    let inheritedMessageBodyMaxLength = DEFAULT_MESSAGE_BODY_MAX_LENGTH;

    if (parentBucketId !== null) {
      const parent = await repo.findOne({
        where: { id: parentBucketId },
        relations: ['settings'],
      });
      if (parent !== null) {
        inheritedIsPublic = parent.isPublic;
        inheritedMessageBodyMaxLength =
          parent.settings?.messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH;
      }
    }
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const bucket = repo.create({
        ownerId: data.ownerId,
        name: data.name,
        type: data.type ?? 'rss-network',
        isPublic: inheritedIsPublic,
        parentBucketId,
        shortId: generateShortId(),
      });
      try {
        const saved = await repo.save(bucket);
        await settingsRepo.insert({
          bucketId: saved.id,
          messageBodyMaxLength: inheritedMessageBodyMaxLength,
        });
        return saved;
      } catch (err) {
        const isUniqueViolation =
          err !== null &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: string }).code === '23505';
        if (!isUniqueViolation || attempt === maxRetries - 1) {
          throw err;
        }
      }
    }
    throw new Error('BucketService.create: failed after retries');
  }

  static async createRssNetwork(data: {
    ownerId: string;
    name: string;
    isPublic?: boolean;
    parentBucketId?: string | null;
  }): Promise<Bucket> {
    return BucketService.create({
      ownerId: data.ownerId,
      name: data.name,
      type: 'rss-network',
      isPublic: data.isPublic,
      parentBucketId: data.parentBucketId,
    });
  }

  static async createRssChannel(data: {
    ownerId: string;
    name: string;
    isPublic?: boolean;
    parentBucketId?: string | null;
  }): Promise<Bucket> {
    return BucketService.create({
      ownerId: data.ownerId,
      name: data.name,
      type: 'rss-channel',
      isPublic: data.isPublic,
      parentBucketId: data.parentBucketId,
    });
  }

  static async createRssItem(data: {
    ownerId: string;
    name: string;
    isPublic?: boolean;
    parentBucketId: string;
  }): Promise<Bucket> {
    return BucketService.create({
      ownerId: data.ownerId,
      name: data.name,
      type: 'rss-item',
      isPublic: data.isPublic,
      parentBucketId: data.parentBucketId,
    });
  }

  static async update(
    id: string,
    data: { name?: string; isPublic?: boolean; messageBodyMaxLength?: number }
  ): Promise<void> {
    const bucketRepo = appDataSourceReadWrite.getRepository(Bucket);
    const settingsRepo = appDataSourceReadWrite.getRepository(BucketSettings);
    const bucketUpdate: Partial<Pick<Bucket, 'name' | 'isPublic'>> = {};
    if (data.name !== undefined) bucketUpdate.name = data.name;
    if (data.isPublic !== undefined) bucketUpdate.isPublic = data.isPublic;
    if (Object.keys(bucketUpdate).length > 0) {
      await bucketRepo.update(id, bucketUpdate);
    }
    if (data.messageBodyMaxLength !== undefined) {
      BucketService.assertMessageBodyMaxLength(data.messageBodyMaxLength);
      const existing = await settingsRepo.findOne({ where: { bucketId: id } });
      if (existing !== null) {
        await settingsRepo.update(
          { bucketId: id },
          { messageBodyMaxLength: data.messageBodyMaxLength }
        );
      } else {
        await settingsRepo.insert({
          bucketId: id,
          messageBodyMaxLength: data.messageBodyMaxLength,
        });
      }
    }
  }

  static async applyGeneralSettingsToDescendants(
    bucketId: string,
    data: { isPublic?: boolean; messageBodyMaxLength?: number }
  ): Promise<void> {
    const descendantIds = await BucketService.findDescendantIds(bucketId);
    if (descendantIds.length === 0) {
      return;
    }

    if (data.isPublic !== undefined) {
      const bucketRepo = appDataSourceReadWrite.getRepository(Bucket);
      await bucketRepo
        .createQueryBuilder()
        .update(Bucket)
        .set({ isPublic: data.isPublic })
        .where('id IN (:...descendantIds)', { descendantIds })
        .execute();
    }

    if (data.messageBodyMaxLength !== undefined) {
      BucketService.assertMessageBodyMaxLength(data.messageBodyMaxLength);
      await appDataSourceReadWrite.query(
        `
          INSERT INTO bucket_settings (bucket_id, message_body_max_length)
          SELECT id, $2
          FROM bucket
          WHERE id = ANY($1::uuid[])
          ON CONFLICT (bucket_id)
          DO UPDATE SET message_body_max_length = EXCLUDED.message_body_max_length
        `,
        [descendantIds, data.messageBodyMaxLength]
      );
    }
  }

  static async delete(id: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(Bucket);
    await repo.delete(id);
  }
}
