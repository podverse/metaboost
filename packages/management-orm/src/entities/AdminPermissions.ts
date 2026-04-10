import type { ManagementUser } from './ManagementUser.js';

import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';

export type EventVisibility = 'own' | 'all_admins' | 'all';

/** CRUD bitmask: create=1, read=2, update=4, delete=8. Value 0–15. */
export const CrudMask = { create: 1, read: 2, update: 4, delete: 8 } as const;

export type CrudOp = keyof typeof CrudMask;

export function hasCrud(crud: number, op: CrudOp): boolean {
  return (crud & CrudMask[op]) !== 0;
}

@Entity('admin_permissions')
export class AdminPermissions {
  @PrimaryColumn({ name: 'admin_id', type: 'uuid' })
  adminId!: string;

  @Column({ name: 'admins_crud', type: 'integer', default: 0 })
  adminsCrud!: number;

  @Column({ name: 'users_crud', type: 'integer', default: 0 })
  usersCrud!: number;

  @Column({ name: 'buckets_crud', type: 'integer', default: 0 })
  bucketsCrud!: number;

  @Column({ name: 'bucket_messages_crud', type: 'integer', default: 0 })
  bucketMessagesCrud!: number;

  @Column({ name: 'bucket_admins_crud', type: 'integer', default: 0 })
  bucketAdminsCrud!: number;

  @Column({ name: 'event_visibility', type: 'text', default: 'all_admins' })
  eventVisibility!: EventVisibility;

  @OneToOne('ManagementUser', 'permissions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  managementUser!: ManagementUser;
}
