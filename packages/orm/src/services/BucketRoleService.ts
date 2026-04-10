import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketRole } from '../entities/BucketRole.js';

export class BucketRoleService {
  static async findByBucketId(bucketId: string): Promise<BucketRole[]> {
    const repo = appDataSourceRead.getRepository(BucketRole);
    return repo.find({
      where: { bucketId },
      order: { name: 'ASC' },
    });
  }

  static async findById(id: string): Promise<BucketRole | null> {
    const repo = appDataSourceRead.getRepository(BucketRole);
    return repo.findOne({ where: { id } });
  }

  static async findByBucketAndId(bucketId: string, roleId: string): Promise<BucketRole | null> {
    const repo = appDataSourceRead.getRepository(BucketRole);
    return repo.findOne({ where: { bucketId, id: roleId } });
  }

  static async create(data: {
    bucketId: string;
    name: string;
    bucketCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
  }): Promise<BucketRole> {
    const repo = appDataSourceReadWrite.getRepository(BucketRole);
    const role = repo.create(data);
    return repo.save(role);
  }

  static async update(
    id: string,
    data: {
      name?: string;
      bucketCrud?: number;
      bucketMessagesCrud?: number;
      bucketAdminsCrud?: number;
    }
  ): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketRole);
    const update: Partial<
      Pick<BucketRole, 'name' | 'bucketCrud' | 'bucketMessagesCrud' | 'bucketAdminsCrud'>
    > = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.bucketCrud !== undefined) update.bucketCrud = data.bucketCrud;
    if (data.bucketMessagesCrud !== undefined) {
      update.bucketMessagesCrud = data.bucketMessagesCrud;
    }
    if (data.bucketAdminsCrud !== undefined) update.bucketAdminsCrud = data.bucketAdminsCrud;
    if (Object.keys(update).length > 0) {
      await repo.update({ id }, update);
    }
  }

  static async delete(id: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketRole);
    await repo.delete({ id });
  }
}
