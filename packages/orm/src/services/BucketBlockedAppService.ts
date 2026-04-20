import { Brackets } from 'typeorm';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketBlockedApp } from '../entities/BucketBlockedApp.js';

export class BucketBlockedAppService {
  static async listAppIdsByRootBucketId(rootBucketId: string): Promise<string[]> {
    const repo = appDataSourceRead.getRepository(BucketBlockedApp);
    const rows = await repo.find({
      where: { rootBucketId },
      select: ['appId'],
    });
    return rows.map((r) => r.appId);
  }

  static async listForRoot(rootBucketId: string, search?: string): Promise<BucketBlockedApp[]> {
    const repo = appDataSourceRead.getRepository(BucketBlockedApp);
    const qb = repo
      .createQueryBuilder('b')
      .where('b.root_bucket_id = :rootBucketId', { rootBucketId })
      .orderBy('b.created_at', 'DESC');
    const trimmed = search?.trim();
    if (trimmed !== undefined && trimmed !== '') {
      const escaped = trimmed.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
      const pattern = `%${escaped}%`;
      qb.andWhere(
        new Brackets((bq) => {
          bq.where("b.app_id ILIKE :pattern ESCAPE '\\'", { pattern }).orWhere(
            "b.app_name_snapshot ILIKE :pattern ESCAPE '\\'",
            { pattern }
          );
        })
      );
    }
    return qb.getMany();
  }

  static async add(
    rootBucketId: string,
    appId: string,
    appNameSnapshot: string | null
  ): Promise<BucketBlockedApp> {
    const repo = appDataSourceReadWrite.getRepository(BucketBlockedApp);
    const existing = await repo.findOne({ where: { rootBucketId, appId } });
    if (existing !== null) {
      existing.appNameSnapshot = appNameSnapshot;
      return repo.save(existing);
    }
    return repo.save(
      repo.create({
        rootBucketId,
        appId,
        appNameSnapshot,
      })
    );
  }

  static async deleteByIdAndRoot(id: string, rootBucketId: string): Promise<boolean> {
    const repo = appDataSourceReadWrite.getRepository(BucketBlockedApp);
    const res = await repo.delete({ id, rootBucketId });
    return (res.affected ?? 0) > 0;
  }

  static async isBlockedForRoot(rootBucketId: string, appId: string): Promise<boolean> {
    const repo = appDataSourceRead.getRepository(BucketBlockedApp);
    const count = await repo.count({ where: { rootBucketId, appId } });
    return count > 0;
  }
}
