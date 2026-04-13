import type { Bucket } from './Bucket.js';

import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { URL_MAX_LENGTH } from '@metaboost/helpers';

@Entity('bucket_rss_item_info')
export class BucketRSSItemInfo {
  @Column({ name: 'bucket_id', primary: true })
  bucketId!: string;

  @Column({ name: 'parent_rss_channel_bucket_id' })
  parentRssChannelBucketId!: string;

  @Column({ name: 'rss_item_guid', type: 'varchar', length: URL_MAX_LENGTH })
  rssItemGuid!: string;

  @OneToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;
}
