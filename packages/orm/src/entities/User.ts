import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';

import { NANO_ID_V2_MAX_LENGTH } from '@metaboost/helpers';

import { UserBio } from './UserBio.js';
import { UserCredentials } from './UserCredentials.js';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_text', length: NANO_ID_V2_MAX_LENGTH, unique: true })
  idText!: string;

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
