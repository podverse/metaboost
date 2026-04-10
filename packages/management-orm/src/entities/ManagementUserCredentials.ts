import type { ManagementUser } from './ManagementUser.js';

import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';

import { PASSWORD_HASH_LENGTH, SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('management_user_credentials')
export class ManagementUserCredentials {
  @PrimaryColumn({ name: 'management_user_id', type: 'uuid' })
  managementUserId!: string;

  @Column({ type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, unique: true })
  username!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: PASSWORD_HASH_LENGTH })
  passwordHash!: string;

  @OneToOne('ManagementUser', 'credentials', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'management_user_id' })
  managementUser!: ManagementUser;
}
