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

@Entity('bucket_role')
export class BucketRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bucket_id' })
  bucketId!: string;

  @Column({ type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, name: 'name' })
  name!: string;

  @Column({ name: 'bucket_crud', type: 'integer' })
  bucketCrud!: number;

  @Column({ name: 'bucket_messages_crud', type: 'integer' })
  bucketMessagesCrud!: number;

  @Column({ name: 'bucket_admins_crud', type: 'integer' })
  bucketAdminsCrud!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;
}
