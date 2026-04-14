import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketRSSItemInfo } from '../entities/BucketRSSItemInfo.js';

export class BucketRSSItemInfoService {
  static async findByParentChannelBucketIdAndItemGuid(
    parentRssChannelBucketId: string,
    rssItemGuid: string
  ): Promise<BucketRSSItemInfo | null> {
    const repo = appDataSourceRead.getRepository(BucketRSSItemInfo);
    return repo.findOne({
      where: { parentRssChannelBucketId, rssItemGuid },
    });
  }

  static async upsert(data: {
    bucketId: string;
    parentRssChannelBucketId: string;
    rssItemGuid: string;
    rssItemPubDate?: Date;
    orphaned?: boolean;
  }): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketRSSItemInfo);
    await repo.upsert(
      {
        bucketId: data.bucketId,
        parentRssChannelBucketId: data.parentRssChannelBucketId,
        rssItemGuid: data.rssItemGuid,
        rssItemPubDate: data.rssItemPubDate ?? new Date(0),
        orphaned: data.orphaned ?? false,
      },
      ['bucketId']
    );
  }
}
