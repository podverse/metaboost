import type { ManagementUser } from './ManagementUser.js';

import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('management_user_bio')
export class ManagementUserBio {
  @PrimaryColumn({ name: 'management_user_id', type: 'uuid' })
  managementUserId!: string;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: SHORT_TEXT_MAX_LENGTH,
    nullable: false,
    unique: true,
  })
  displayName!: string;

  @OneToOne('ManagementUser', 'bio', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'management_user_id' })
  managementUser!: ManagementUser;
}
