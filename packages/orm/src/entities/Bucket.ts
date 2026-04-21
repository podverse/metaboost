import type { BucketSettings } from './BucketSettings.js';
import type { User } from './User.js';
import type { BucketType, MbBucketType, RssBucketType } from '@metaboost/helpers-requests';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { SHORT_ID_LENGTH, SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

export type { BucketType, MbBucketType, RssBucketType };

export const BUCKET_TYPE_VALUES = [
  'rss-network',
  'rss-channel',
  'rss-item',
  'mb-root',
  'mb-mid',
  'mb-leaf',
] as const satisfies readonly BucketType[];

@Entity('bucket')
export class Bucket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id' })
  ownerId!: string;

  @Column({ type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  name!: string;

  @Column({ type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, default: 'rss-network' })
  type!: BucketType;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ name: 'parent_bucket_id', type: 'uuid', nullable: true })
  parentBucketId!: string | null;

  @Column({ name: 'short_id', length: SHORT_ID_LENGTH, unique: true })
  shortId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne('BucketSettings', (bs: BucketSettings) => bs.bucket)
  settings!: BucketSettings | null;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @ManyToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_bucket_id' })
  parentBucket!: Bucket | null;

  @OneToMany('Bucket', (b: Bucket) => b.parentBucket)
  topics!: Bucket[];
}
