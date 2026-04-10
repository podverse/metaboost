import type { Bucket } from './Bucket.js';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@boilerplate/helpers';

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

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;
}
