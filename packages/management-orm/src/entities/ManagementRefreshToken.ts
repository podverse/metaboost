import type { ManagementUser } from './ManagementUser.js';

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { TOKEN_HASH_HEX_LENGTH } from '@metaboost/helpers';

@Entity('management_refresh_token')
export class ManagementRefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'management_user_id' })
  managementUserId!: string;

  @Column({ name: 'token_hash', type: 'varchar', length: TOKEN_HASH_HEX_LENGTH })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @ManyToOne('ManagementUser', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'management_user_id' })
  managementUser!: ManagementUser;
}
