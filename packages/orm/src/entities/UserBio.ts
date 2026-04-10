import type { User } from './User.js';

import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@boilerplate/helpers';

@Entity('user_bio')
export class UserBio {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ name: 'display_name', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  displayName!: string | null;

  @OneToOne('User', (u: User) => u.bio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
