import type { ManagementUserCredentials } from './ManagementUserCredentials.js';

import { Entity, PrimaryColumn, Column, OneToOne } from 'typeorm';

import { AdminPermissions } from './AdminPermissions.js';
import { ManagementUserBio } from './ManagementUserBio.js';

@Entity('management_user')
export class ManagementUser {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'is_super_admin', type: 'boolean', default: false })
  isSuperAdmin!: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @OneToOne('ManagementUserCredentials', 'managementUser')
  credentials!: ManagementUserCredentials;

  @OneToOne(() => ManagementUserBio, (b) => b.managementUser)
  bio!: ManagementUserBio;

  @OneToOne(() => AdminPermissions, (p) => p.managementUser, { nullable: true })
  permissions?: AdminPermissions | null;
}
