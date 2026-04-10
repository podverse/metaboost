import type { BucketAdminInvitationStatus } from '../entities/BucketAdminInvitation.js';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketAdminInvitation } from '../entities/BucketAdminInvitation.js';

export class BucketAdminInvitationService {
  static async findByToken(token: string): Promise<BucketAdminInvitation | null> {
    const repo = appDataSourceRead.getRepository(BucketAdminInvitation);
    return repo.findOne({
      where: { token },
      relations: ['bucket'],
    });
  }

  static async create(data: {
    bucketId: string;
    token: string;
    bucketCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
    expiresAt: Date;
  }): Promise<BucketAdminInvitation> {
    const repo = appDataSourceReadWrite.getRepository(BucketAdminInvitation);
    const inv = repo.create({ ...data, status: 'pending' as const });
    return repo.save(inv);
  }

  static async findByBucketIdPending(bucketId: string): Promise<BucketAdminInvitation[]> {
    const repo = appDataSourceRead.getRepository(BucketAdminInvitation);
    return repo.find({
      where: { bucketId, status: 'pending' },
      order: { expiresAt: 'ASC' },
    });
  }

  static async updateStatus(id: string, status: BucketAdminInvitationStatus): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketAdminInvitation);
    await repo.update({ id }, { status });
  }

  static async remove(id: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketAdminInvitation);
    await repo.delete({ id });
  }
}
