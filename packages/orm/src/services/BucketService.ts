import type { BucketType } from '../entities/Bucket.js';

import { Brackets } from 'typeorm';

import { DEFAULT_MESSAGE_BODY_MAX_LENGTH, generateShortId } from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { Bucket } from '../entities/Bucket.js';
import { BucketSettings } from '../entities/BucketSettings.js';

export class BucketService {
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
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const bucket = repo.create({
        ownerId: data.ownerId,
        name: data.name,
        type: data.type ?? 'rss-network',
        isPublic: data.isPublic ?? true,
        parentBucketId: data.parentBucketId ?? null,
        shortId: generateShortId(),
      });
      try {
        const saved = await repo.save(bucket);
        if (saved.parentBucketId === null) {
          const settingsRepo = appDataSourceReadWrite.getRepository(BucketSettings);
          await settingsRepo.insert({
            bucketId: saved.id,
            messageBodyMaxLength: DEFAULT_MESSAGE_BODY_MAX_LENGTH,
          });
        }
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
    data: { name?: string; isPublic?: boolean; messageBodyMaxLength?: number | null }
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

  static async delete(id: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(Bucket);
    await repo.delete(id);
  }
}
