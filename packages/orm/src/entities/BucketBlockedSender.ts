import type { Bucket } from './Bucket.js';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { MEDIUM_TEXT_MAX_LENGTH, SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('bucket_blocked_sender')
@Unique(['rootBucketId', 'senderGuid'])
export class BucketBlockedSender {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'root_bucket_id', type: 'uuid' })
  rootBucketId!: string;

  @ManyToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'root_bucket_id' })
  rootBucket!: Bucket;

  @Column({ name: 'sender_guid', type: 'varchar', length: MEDIUM_TEXT_MAX_LENGTH })
  senderGuid!: string;

  @Column({
    name: 'label_snapshot',
    type: 'varchar',
    length: SHORT_TEXT_MAX_LENGTH,
    nullable: true,
  })
  labelSnapshot!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
