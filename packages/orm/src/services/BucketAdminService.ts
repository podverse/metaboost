import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketAdmin } from '../entities/BucketAdmin.js';

export class BucketAdminService {
  static async findByBucketId(bucketId: string): Promise<BucketAdmin[]> {
    const repo = appDataSourceRead.getRepository(BucketAdmin);
    return repo.find({
      where: { bucketId },
      relations: ['user', 'user.credentials', 'user.bio'],
      order: { createdAt: 'ASC' },
    });
  }

  static async findByBucketAndUser(bucketId: string, userId: string): Promise<BucketAdmin | null> {
    const repo = appDataSourceRead.getRepository(BucketAdmin);
    return repo.findOne({ where: { bucketId, userId } });
  }

  static async create(data: {
    bucketId: string;
    userId: string;
    bucketCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
  }): Promise<BucketAdmin> {
    const repo = appDataSourceReadWrite.getRepository(BucketAdmin);
    const admin = repo.create(data);
    return repo.save(admin);
  }

  static async update(
    bucketId: string,
    userId: string,
    data: { bucketCrud?: number; bucketMessagesCrud?: number; bucketAdminsCrud?: number }
  ): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketAdmin);
    const update: Partial<
      Pick<BucketAdmin, 'bucketCrud' | 'bucketMessagesCrud' | 'bucketAdminsCrud'>
    > = {};
    if (data.bucketCrud !== undefined) update.bucketCrud = data.bucketCrud;
    if (data.bucketMessagesCrud !== undefined) {
      update.bucketMessagesCrud = data.bucketMessagesCrud;
    }
    if (data.bucketAdminsCrud !== undefined) update.bucketAdminsCrud = data.bucketAdminsCrud;
    if (Object.keys(update).length > 0) {
      await repo.update({ bucketId, userId }, update);
    }
  }

  static async remove(bucketId: string, userId: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketAdmin);
    await repo.delete({ bucketId, userId });
  }
}
