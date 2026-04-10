import type { Bucket } from './Bucket.js';
import type { User } from './User.js';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('bucket_admin')
export class BucketAdmin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bucket_id' })
  bucketId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'bucket_crud', type: 'integer', default: 0 })
  bucketCrud!: number;

  @Column({ name: 'bucket_messages_crud', type: 'integer', default: 0 })
  bucketMessagesCrud!: number;

  @Column({ name: 'bucket_admins_crud', type: 'integer', default: 2 })
  bucketAdminsCrud!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
