import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';

import { SHORT_ID_LENGTH } from '@metaboost/helpers';

import { UserBio } from './UserBio.js';
import { UserCredentials } from './UserCredentials.js';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'short_id', length: SHORT_ID_LENGTH, unique: true })
  shortId!: string;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => UserCredentials, (c) => c.user)
  credentials!: UserCredentials;

  @OneToOne(() => UserBio, (b) => b.user)
  bio!: UserBio;
}
