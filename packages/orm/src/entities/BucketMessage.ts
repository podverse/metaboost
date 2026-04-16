import type { Bucket } from './Bucket.js';
import type { BucketMessageAppMeta } from './BucketMessageAppMeta.js';
import type { BucketMessageValue } from './BucketMessageValue.js';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

export type BucketMessageSourceBucketSummary = {
  id: string;
  shortId: string;
  name: string;
  type: 'rss-network' | 'rss-channel' | 'rss-item';
};

export type BucketMessageSourceBucketContext = {
  bucket: BucketMessageSourceBucketSummary;
  parentBucket: BucketMessageSourceBucketSummary | null;
};

@Entity('bucket_message')
export class BucketMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'message_guid', type: 'uuid', unique: true })
  messageGuid!: string;

  @Column({ name: 'bucket_id' })
  bucketId!: string;

  @Column({ name: 'sender_name', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  senderName!: string | null;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ name: 'action', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  action!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;

  @OneToOne('BucketMessageAppMeta', (appMeta: BucketMessageAppMeta) => appMeta.message)
  appMeta?: BucketMessageAppMeta;

  @OneToOne('BucketMessageValue', (value: BucketMessageValue) => value.message)
  value?: BucketMessageValue;

  // Compatibility fields hydrated by BucketMessageService to preserve current API payload shape.
  appName!: string;
  appVersion!: string | null;
  senderId!: string | null;
  podcastIndexFeedId!: number | null;
  timePosition!: string | null;
  currency!: string;
  amount!: string;
  amountUnit!: string | null;
  sourceBucketContext?: BucketMessageSourceBucketContext;
}
