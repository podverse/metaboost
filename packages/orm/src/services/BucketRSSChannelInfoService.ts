import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketRSSChannelInfo } from '../entities/BucketRSSChannelInfo.js';

export class BucketRSSChannelInfoService {
  static async findByBucketId(bucketId: string): Promise<BucketRSSChannelInfo | null> {
    const repo = appDataSourceRead.getRepository(BucketRSSChannelInfo);
    return repo.findOne({ where: { bucketId } });
  }

  static async upsert(data: {
    bucketId: string;
    rssPodcastGuid: string;
    rssChannelTitle: string;
  }): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketRSSChannelInfo);
    await repo.upsert(
      {
        bucketId: data.bucketId,
        rssPodcastGuid: data.rssPodcastGuid,
        rssChannelTitle: data.rssChannelTitle,
      },
      ['bucketId']
    );
  }
}
