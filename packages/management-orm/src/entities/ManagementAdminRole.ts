import type { EventVisibility } from './AdminPermissions.js';

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('management_admin_role')
export class ManagementAdminRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 50, unique: true })
  name!: string;

  @Column({ name: 'admins_crud', type: 'integer' })
  adminsCrud!: number;

  @Column({ name: 'users_crud', type: 'integer' })
  usersCrud!: number;

  @Column({ name: 'buckets_crud', type: 'integer' })
  bucketsCrud!: number;

  @Column({ name: 'bucket_messages_crud', type: 'integer' })
  bucketMessagesCrud!: number;

  @Column({ name: 'bucket_admins_crud', type: 'integer' })
  bucketAdminsCrud!: number;

  @Column({ name: 'event_visibility', type: 'text' })
  eventVisibility!: EventVisibility;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
