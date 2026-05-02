import type { BucketType } from '../entities/Bucket.js';
import type { AscDescSortOrder, SqlSortDirection } from '@metaboost/helpers';

import { Brackets, In } from 'typeorm';

import {
  DEFAULT_MESSAGE_BODY_MAX_LENGTH,
  MAX_MESSAGE_BODY_MAX_LENGTH,
  MIN_MESSAGE_BODY_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  generateRandomIdText,
} from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { Bucket } from '../entities/Bucket.js';
import { BucketSettings } from '../entities/BucketSettings.js';

export class BucketService {
  static readonly DEFAULT_PREFERRED_CURRENCY = 'USD';
  static readonly DEFAULT_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR = 0;
  static readonly MIN_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR = 0;
  static readonly MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR = 2_147_483_647;

  private static assertMessageBodyMaxLength(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < MIN_MESSAGE_BODY_MAX_LENGTH ||
      value > MAX_MESSAGE_BODY_MAX_LENGTH
    ) {
      throw new Error(
        `messageBodyMaxLength must be an integer between ${MIN_MESSAGE_BODY_MAX_LENGTH} and ${MAX_MESSAGE_BODY_MAX_LENGTH}`
      );
    }
  }

  private static normalizePreferredCurrency(value: string): string {
    return value.trim().toUpperCase();
  }

  private static assertPreferredCurrency(value: string): void {
    const normalized = BucketService.normalizePreferredCurrency(value);
    if (normalized === '' || normalized.length > SHORT_TEXT_MAX_LENGTH) {
      throw new Error(`preferredCurrency must be 1-${SHORT_TEXT_MAX_LENGTH} chars`);
    }
  }

  private static assertPublicBoostDisplayMinimumMinor(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < BucketService.MIN_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR ||
      value > BucketService.MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR
    ) {
      throw new Error(
        `publicBoostDisplayMinimumMinor must be an integer between ${BucketService.MIN_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR} and ${BucketService.MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR}`
      );
    }
  }

  static isAllowedChildType(parentType: BucketType, childType: BucketType): boolean {
    if (parentType === 'rss-network') {
      return childType === 'rss-channel';
    }
    if (parentType === 'mb-root') {
      return childType === 'mb-mid';
    }
    if (parentType === 'mb-mid') {
      return childType === 'mb-leaf';
    }
    return false;
  }

  static isMbFamilyType(type: BucketType): boolean {
    return type === 'mb-root' || type === 'mb-mid' || type === 'mb-leaf';
  }

  static isRssFamilyType(type: BucketType): boolean {
    return type === 'rss-network' || type === 'rss-channel' || type === 'rss-item';
  }

  static async findById(id: string): Promise<Bucket | null> {
    const repo = appDataSourceRead.getRepository(Bucket);
    return repo.findOne({ where: { id }, relations: ['settings'] });
  }

  static async findByIdText(idText: string): Promise<Bucket | null> {
    const repo = appDataSourceRead.getRepository(Bucket);
    return repo.findOne({ where: { idText }, relations: ['settings'] });
  }

  static async findByIds(ids: string[]): Promise<Bucket[]> {
    if (ids.length === 0) {
      return [];
    }
    const repo = appDataSourceRead.getRepository(Bucket);
    return repo.find({
      where: { id: In(ids) },
      relations: ['settings'],
    });
  }

  /**
   * List buckets where user is owner or has a bucket_admin row (any permission).
   * Optional search filters by bucket name (case-insensitive substring).
   */
  static async findAccessibleByUser(
    userId: string,
    options?: { search?: string; sortBy?: string; sortOrder?: AscDescSortOrder }
  ): Promise<Bucket[]> {
    const repo = appDataSourceRead.getRepository(Bucket);
    const orderBy =
      options?.sortBy !== undefined &&
      (BucketService.LIST_PAGINATED_SORT_FIELDS as readonly string[]).includes(options.sortBy)
        ? options.sortBy
        : 'name';
    const orderDir: SqlSortDirection =
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

  /**
   * Children of a parent bucket. Optional name search and sort.
   * Sort keys align with bucket detail UI: name, created, isPublic; lastMessage is resolved in API after enriching lastMessageAt.
   */
  static async findChildren(
    parentBucketId: string,
    options?: {
      search?: string;
      sortBy?: string;
      sortOrder?: AscDescSortOrder;
    }
  ): Promise<Bucket[]> {
    const repo = appDataSourceRead.getRepository(Bucket);
    const qb = repo
      .createQueryBuilder('bucket')
      .leftJoinAndSelect('bucket.settings', 'settings')
      .where('bucket.parent_bucket_id = :pid', { pid: parentBucketId });

    const searchTrim = options?.search?.trim();
    if (searchTrim !== undefined && searchTrim !== '') {
      const escaped = searchTrim.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
      qb.andWhere("LOWER(bucket.name) LIKE LOWER(:search) ESCAPE '\\'", {
        search: `%${escaped}%`,
      });
    }

    const raw = options?.sortBy?.trim();
    let dbSort: 'name' | 'createdAt' | 'isPublic' | 'lastMessage' | undefined;
    if (raw === 'name') {
      dbSort = 'name';
    } else if (raw === 'created' || raw === 'createdAt') {
      dbSort = 'createdAt';
    } else if (raw === 'isPublic') {
      dbSort = 'isPublic';
    } else if (raw === 'lastMessage') {
      dbSort = 'lastMessage';
    }

    const orderDir: SqlSortDirection =
      options?.sortOrder === 'asc' ? 'ASC' : options?.sortOrder === 'desc' ? 'DESC' : 'DESC';

    if (dbSort === 'name') {
      qb.addSelect('LOWER(bucket.name)', '_sort_child_name').orderBy('_sort_child_name', orderDir);
    } else if (dbSort === 'createdAt') {
      qb.orderBy('bucket.createdAt', orderDir);
    } else if (dbSort === 'isPublic') {
      qb.orderBy('bucket.isPublic', orderDir);
    } else if (dbSort === 'lastMessage') {
      qb.orderBy('bucket.createdAt', 'DESC');
    } else {
      qb.orderBy('bucket.createdAt', 'DESC');
    }

    return qb.getMany();
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

  /** Hierarchy root bucket id (walk parents until none). */
  static async resolveRootBucketId(bucketId: string): Promise<string | null> {
    let current = await BucketService.findById(bucketId);
    if (current === null) {
      return null;
    }
    while (current.parentBucketId !== null) {
      const parent = await BucketService.findById(current.parentBucketId);
      if (parent === null) {
        return current.id;
      }
      current = parent;
    }
    return current.id;
  }

  /** Group bucket ids by hierarchy root (for per-root blocked-sender filters). */
  static async groupBucketIdsByRoot(bucketIds: string[]): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    const seen = new Set<string>();
    for (const bid of bucketIds) {
      if (seen.has(bid)) {
        continue;
      }
      seen.add(bid);
      const root = await BucketService.resolveRootBucketId(bid);
      if (root === null) {
        continue;
      }
      const list = map.get(root) ?? [];
      list.push(bid);
      map.set(root, list);
    }
    return map;
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
    sortOrder?: AscDescSortOrder
  ): Promise<{ buckets: Bucket[]; total: number }> {
    const repo = appDataSourceRead.getRepository(Bucket);
    const orderBy =
      sortBy !== undefined &&
      (BucketService.LIST_PAGINATED_SORT_FIELDS as readonly string[]).includes(sortBy)
        ? sortBy
        : 'name';
    const orderDir: SqlSortDirection =
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
    topLevelPreferredCurrency?: string;
    topLevelPublicBoostDisplayMinimumMinor?: number;
  }): Promise<Bucket> {
    const repo = appDataSourceReadWrite.getRepository(Bucket);
    const settingsRepo = appDataSourceReadWrite.getRepository(BucketSettings);
    const parentBucketId = data.parentBucketId ?? null;
    let inheritedIsPublic = data.isPublic ?? true;
    let inheritedMessageBodyMaxLength = DEFAULT_MESSAGE_BODY_MAX_LENGTH;
    let inheritedPreferredCurrency = BucketService.DEFAULT_PREFERRED_CURRENCY;
    let inheritedPublicBoostDisplayMinimumMinor =
      BucketService.DEFAULT_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR;

    if (parentBucketId !== null) {
      const parent = await repo.findOne({
        where: { id: parentBucketId },
        relations: ['settings'],
      });
      if (parent !== null) {
        inheritedIsPublic = parent.isPublic;
        inheritedMessageBodyMaxLength =
          parent.settings?.messageBodyMaxLength ?? DEFAULT_MESSAGE_BODY_MAX_LENGTH;
        inheritedPreferredCurrency =
          parent.settings?.preferredCurrency ?? BucketService.DEFAULT_PREFERRED_CURRENCY;
        inheritedPublicBoostDisplayMinimumMinor =
          parent.settings?.publicBoostDisplayMinimumMinor ??
          BucketService.DEFAULT_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR;
      }
    } else if (
      data.topLevelPreferredCurrency !== undefined &&
      data.topLevelPreferredCurrency.trim() !== ''
    ) {
      BucketService.assertPreferredCurrency(data.topLevelPreferredCurrency);
      inheritedPreferredCurrency = BucketService.normalizePreferredCurrency(
        data.topLevelPreferredCurrency
      );
    }
    if (parentBucketId === null && data.topLevelPublicBoostDisplayMinimumMinor !== undefined) {
      BucketService.assertPublicBoostDisplayMinimumMinor(
        data.topLevelPublicBoostDisplayMinimumMinor
      );
      inheritedPublicBoostDisplayMinimumMinor = data.topLevelPublicBoostDisplayMinimumMinor;
    }
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const bucket = repo.create({
        ownerId: data.ownerId,
        name: data.name,
        type: data.type ?? 'rss-network',
        isPublic: inheritedIsPublic,
        parentBucketId,
        idText: generateRandomIdText(),
      });
      try {
        const saved = await repo.save(bucket);
        await settingsRepo.insert({
          bucketId: saved.id,
          messageBodyMaxLength: inheritedMessageBodyMaxLength,
          preferredCurrency: inheritedPreferredCurrency,
          publicBoostDisplayMinimumMinor: inheritedPublicBoostDisplayMinimumMinor,
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
    topLevelPreferredCurrency?: string;
    topLevelPublicBoostDisplayMinimumMinor?: number;
  }): Promise<Bucket> {
    return BucketService.create({
      ownerId: data.ownerId,
      name: data.name,
      type: 'rss-network',
      isPublic: data.isPublic,
      parentBucketId: data.parentBucketId,
      topLevelPreferredCurrency: data.topLevelPreferredCurrency,
      topLevelPublicBoostDisplayMinimumMinor: data.topLevelPublicBoostDisplayMinimumMinor,
    });
  }

  static async createRssChannel(data: {
    ownerId: string;
    name: string;
    isPublic?: boolean;
    parentBucketId?: string | null;
    topLevelPreferredCurrency?: string;
    topLevelPublicBoostDisplayMinimumMinor?: number;
  }): Promise<Bucket> {
    return BucketService.create({
      ownerId: data.ownerId,
      name: data.name,
      type: 'rss-channel',
      isPublic: data.isPublic,
      parentBucketId: data.parentBucketId,
      topLevelPreferredCurrency: data.topLevelPreferredCurrency,
      topLevelPublicBoostDisplayMinimumMinor: data.topLevelPublicBoostDisplayMinimumMinor,
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

  static async createMbRoot(data: {
    ownerId: string;
    name: string;
    isPublic?: boolean;
    topLevelPreferredCurrency?: string;
    topLevelPublicBoostDisplayMinimumMinor?: number;
  }): Promise<Bucket> {
    return BucketService.create({
      ownerId: data.ownerId,
      name: data.name,
      type: 'mb-root',
      isPublic: data.isPublic,
      parentBucketId: null,
      topLevelPreferredCurrency: data.topLevelPreferredCurrency,
      topLevelPublicBoostDisplayMinimumMinor: data.topLevelPublicBoostDisplayMinimumMinor,
    });
  }

  static async createMbMid(data: {
    ownerId: string;
    name: string;
    isPublic?: boolean;
    parentBucketId: string;
  }): Promise<Bucket> {
    return BucketService.create({
      ownerId: data.ownerId,
      name: data.name,
      type: 'mb-mid',
      isPublic: data.isPublic,
      parentBucketId: data.parentBucketId,
    });
  }

  static async createMbLeaf(data: {
    ownerId: string;
    name: string;
    isPublic?: boolean;
    parentBucketId: string;
  }): Promise<Bucket> {
    return BucketService.create({
      ownerId: data.ownerId,
      name: data.name,
      type: 'mb-leaf',
      isPublic: data.isPublic,
      parentBucketId: data.parentBucketId,
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      isPublic?: boolean;
      messageBodyMaxLength?: number;
      preferredCurrency?: string;
      publicBoostDisplayMinimumMinor?: number;
    }
  ): Promise<void> {
    const bucketRepo = appDataSourceReadWrite.getRepository(Bucket);
    const settingsRepo = appDataSourceReadWrite.getRepository(BucketSettings);
    const bucketUpdate: Partial<Pick<Bucket, 'name' | 'isPublic'>> = {};
    if (data.name !== undefined) bucketUpdate.name = data.name;
    if (data.isPublic !== undefined) bucketUpdate.isPublic = data.isPublic;
    if (Object.keys(bucketUpdate).length > 0) {
      await bucketRepo.update(id, bucketUpdate);
    }
    const settingsUpdate: Partial<
      Pick<
        BucketSettings,
        'messageBodyMaxLength' | 'preferredCurrency' | 'publicBoostDisplayMinimumMinor'
      >
    > = {};
    if (data.messageBodyMaxLength !== undefined) {
      BucketService.assertMessageBodyMaxLength(data.messageBodyMaxLength);
      settingsUpdate.messageBodyMaxLength = data.messageBodyMaxLength;
    }
    if (data.preferredCurrency !== undefined) {
      BucketService.assertPreferredCurrency(data.preferredCurrency);
      settingsUpdate.preferredCurrency = BucketService.normalizePreferredCurrency(
        data.preferredCurrency
      );
    }
    if (data.publicBoostDisplayMinimumMinor !== undefined) {
      BucketService.assertPublicBoostDisplayMinimumMinor(data.publicBoostDisplayMinimumMinor);
      settingsUpdate.publicBoostDisplayMinimumMinor = data.publicBoostDisplayMinimumMinor;
    }
    if (Object.keys(settingsUpdate).length > 0) {
      const existing = await settingsRepo.findOne({ where: { bucketId: id } });
      if (existing !== null) {
        await settingsRepo.update({ bucketId: id }, settingsUpdate);
      } else {
        await settingsRepo.insert({
          bucketId: id,
          ...settingsUpdate,
        });
      }
    }
  }

  static async applyGeneralSettingsToDescendants(
    bucketId: string,
    data: {
      isPublic?: boolean;
      messageBodyMaxLength?: number;
      preferredCurrency?: string;
      publicBoostDisplayMinimumMinor?: number;
    }
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
    if (data.preferredCurrency !== undefined) {
      BucketService.assertPreferredCurrency(data.preferredCurrency);
      const normalizedPreferredCurrency = BucketService.normalizePreferredCurrency(
        data.preferredCurrency
      );
      await appDataSourceReadWrite.query(
        `
          INSERT INTO bucket_settings (bucket_id, preferred_currency)
          SELECT id, $2
          FROM bucket
          WHERE id = ANY($1::uuid[])
          ON CONFLICT (bucket_id)
          DO UPDATE SET preferred_currency = EXCLUDED.preferred_currency
        `,
        [descendantIds, normalizedPreferredCurrency]
      );
    }
    if (data.publicBoostDisplayMinimumMinor !== undefined) {
      BucketService.assertPublicBoostDisplayMinimumMinor(data.publicBoostDisplayMinimumMinor);
      await appDataSourceReadWrite.query(
        `
          INSERT INTO bucket_settings (bucket_id, public_boost_display_minimum_minor)
          SELECT id, $2
          FROM bucket
          WHERE id = ANY($1::uuid[])
          ON CONFLICT (bucket_id)
          DO UPDATE SET public_boost_display_minimum_minor = EXCLUDED.public_boost_display_minimum_minor
        `,
        [descendantIds, data.publicBoostDisplayMinimumMinor]
      );
    }
  }

  static async delete(id: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(Bucket);
    await repo.delete(id);
  }
}
