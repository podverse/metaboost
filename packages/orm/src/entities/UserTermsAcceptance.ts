import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

import { TermsVersion } from './TermsVersion.js';
import { User } from './User.js';

@Entity('user_terms_acceptance')
@Unique('uq_user_terms_acceptance_user_version', ['userId', 'termsVersionId'])
export class UserTermsAcceptance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'terms_version_id' })
  termsVersionId!: string;

  @Column({ name: 'accepted_at', type: 'timestamp' })
  acceptedAt!: Date;

  @Column({
    name: 'acceptance_source',
    type: 'varchar',
    length: SHORT_TEXT_MAX_LENGTH,
    nullable: true,
  })
  acceptanceSource!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => TermsVersion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'terms_version_id' })
  termsVersion!: TermsVersion;
}
