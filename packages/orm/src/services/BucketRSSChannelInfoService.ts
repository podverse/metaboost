import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { BucketRSSChannelInfo } from '../entities/BucketRSSChannelInfo.js';

export class BucketRSSChannelInfoService {
  static async findByBucketId(bucketId: string): Promise<BucketRSSChannelInfo | null> {
    const repo = appDataSourceRead.getRepository(BucketRSSChannelInfo);
    return repo.findOne({ where: { bucketId } });
  }

  static async findByPodcastGuid(rssPodcastGuid: string): Promise<BucketRSSChannelInfo | null> {
    const repo = appDataSourceRead.getRepository(BucketRSSChannelInfo);
    return repo.findOne({ where: { rssPodcastGuid } });
  }

  static async upsert(data: {
    bucketId: string;
    rssFeedUrl?: string;
    rssPodcastGuid: string;
    rssChannelTitle: string;
    rssLastParseAttempt?: Date | null;
    rssLastSuccessfulParse?: Date | null;
    rssVerified?: Date | null;
    rssVerificationFailedAt?: Date | null;
    rssLastParsedFeedHash?: string | null;
  }): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(BucketRSSChannelInfo);
    await repo.upsert(
      {
        bucketId: data.bucketId,
        rssFeedUrl: data.rssFeedUrl ?? '',
        rssPodcastGuid: data.rssPodcastGuid,
        rssChannelTitle: data.rssChannelTitle,
        rssLastParseAttempt: data.rssLastParseAttempt ?? null,
        rssLastSuccessfulParse: data.rssLastSuccessfulParse ?? null,
        rssVerified: data.rssVerified ?? null,
        rssVerificationFailedAt: data.rssVerificationFailedAt ?? null,
        rssLastParsedFeedHash: data.rssLastParsedFeedHash ?? null,
      },
      ['bucketId']
    );
  }
}
