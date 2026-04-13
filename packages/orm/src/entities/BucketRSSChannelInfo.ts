import type { Bucket } from './Bucket.js';

import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { MEDIUM_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('bucket_rss_channel_info')
export class BucketRSSChannelInfo {
  @Column({ name: 'bucket_id', primary: true })
  bucketId!: string;

  @Column({
    name: 'rss_podcast_guid',
    type: 'varchar',
    length: MEDIUM_TEXT_MAX_LENGTH,
    unique: true,
  })
  rssPodcastGuid!: string;

  @Column({ name: 'rss_channel_title', type: 'varchar', length: MEDIUM_TEXT_MAX_LENGTH })
  rssChannelTitle!: string;

  @OneToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;
}
