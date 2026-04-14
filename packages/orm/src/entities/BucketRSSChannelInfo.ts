import type { Bucket } from './Bucket.js';

import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { MEDIUM_TEXT_MAX_LENGTH, URL_MAX_LENGTH } from '@metaboost/helpers';

@Entity('bucket_rss_channel_info')
export class BucketRSSChannelInfo {
  @Column({ name: 'bucket_id', primary: true })
  bucketId!: string;

  @Column({
    name: 'rss_feed_url',
    type: 'varchar',
    length: URL_MAX_LENGTH,
  })
  rssFeedUrl!: string;

  @Column({
    name: 'rss_podcast_guid',
    type: 'varchar',
    length: MEDIUM_TEXT_MAX_LENGTH,
    unique: true,
  })
  rssPodcastGuid!: string;

  @Column({ name: 'rss_channel_title', type: 'varchar', length: MEDIUM_TEXT_MAX_LENGTH })
  rssChannelTitle!: string;

  @Column({ name: 'rss_last_parse_attempt', type: 'timestamp', nullable: true })
  rssLastParseAttempt!: Date | null;

  @Column({ name: 'rss_last_successful_parse', type: 'timestamp', nullable: true })
  rssLastSuccessfulParse!: Date | null;

  @Column({ name: 'rss_verified', type: 'timestamp', nullable: true })
  rssVerified!: Date | null;

  @Column({
    name: 'rss_last_parsed_feed_hash',
    type: 'varchar',
    length: MEDIUM_TEXT_MAX_LENGTH,
    nullable: true,
  })
  rssLastParsedFeedHash!: string | null;

  @OneToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;
}
