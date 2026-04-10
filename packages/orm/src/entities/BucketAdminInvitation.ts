import type { Bucket } from './Bucket.js';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { INVITATION_STATUS_MAX_LENGTH, INVITATION_TOKEN_LENGTH } from '@metaboost/helpers';

export type BucketAdminInvitationStatus = 'pending' | 'accepted' | 'rejected';

@Entity('bucket_admin_invitation')
export class BucketAdminInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bucket_id' })
  bucketId!: string;

  @Column({ type: 'varchar', length: INVITATION_TOKEN_LENGTH, unique: true })
  token!: string;

  @Column({ name: 'bucket_crud', type: 'integer', default: 0 })
  bucketCrud!: number;

  @Column({ name: 'bucket_messages_crud', type: 'integer', default: 0 })
  bucketMessagesCrud!: number;

  @Column({ name: 'bucket_admins_crud', type: 'integer', default: 2 })
  bucketAdminsCrud!: number;

  @Column({
    type: 'varchar',
    length: INVITATION_STATUS_MAX_LENGTH,
    default: 'pending',
  })
  status!: BucketAdminInvitationStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @ManyToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;
}
