import { Brackets } from 'typeorm';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketBlockedSender } from '../entities/BucketBlockedSender.js';

export class BucketBlockedSenderService {
  static async listGuidsByRootBucketId(rootBucketId: string): Promise<string[]> {
    const repo = appDataSourceRead.getRepository(BucketBlockedSender);
    const rows = await repo.find({
      where: { rootBucketId },
      select: ['senderGuid'],
    });
    return rows.map((r) => r.senderGuid);
  }

  static async listForRoot(rootBucketId: string, search?: string): Promise<BucketBlockedSender[]> {
    const repo = appDataSourceRead.getRepository(BucketBlockedSender);
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
          bq.where("b.sender_guid ILIKE :pattern ESCAPE '\\'", { pattern }).orWhere(
            "b.label_snapshot ILIKE :pattern ESCAPE '\\'",
            { pattern }
          );
        })
      );
    }
    return qb.getMany();
  }

  static async add(
    rootBucketId: string,
    senderGuid: string,
    labelSnapshot: string | null
  ): Promise<BucketBlockedSender> {
    const repo = appDataSourceReadWrite.getRepository(BucketBlockedSender);
    const existing = await repo.findOne({ where: { rootBucketId, senderGuid } });
    if (existing !== null) {
      existing.labelSnapshot = labelSnapshot;
      return repo.save(existing);
    }
    return repo.save(
      repo.create({
        rootBucketId,
        senderGuid,
        labelSnapshot,
      })
    );
  }

  static async deleteByIdAndRoot(id: string, rootBucketId: string): Promise<boolean> {
    const repo = appDataSourceReadWrite.getRepository(BucketBlockedSender);
    const res = await repo.delete({ id, rootBucketId });
    return (res.affected ?? 0) > 0;
  }
}
