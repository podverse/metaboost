import type { Bucket } from './Bucket.js';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { MEDIUM_TEXT_MAX_LENGTH, SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('bucket_message')
export class BucketMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bucket_id' })
  bucketId!: string;

  @Column({ name: 'sender_name', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  senderName!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'currency', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  currency!: string;

  @Column({ name: 'amount', type: 'numeric' })
  amount!: string;

  @Column({ name: 'amount_unit', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  amountUnit!: string | null;

  @Column({ name: 'action', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  action!: string;

  @Column({ name: 'app_name', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  appName!: string;

  @Column({ name: 'app_version', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  appVersion!: string | null;

  @Column({ name: 'sender_id', type: 'varchar', length: MEDIUM_TEXT_MAX_LENGTH, nullable: true })
  senderId!: string | null;

  @Column({ name: 'podcast_index_feed_id', type: 'integer', nullable: true })
  podcastIndexFeedId!: number | null;

  @Column({ name: 'time_position', type: 'numeric', nullable: true })
  timePosition!: string | null;

  @Column({ name: 'payment_verified_by_app', type: 'boolean', default: false })
  paymentVerifiedByApp!: boolean;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;
}
