import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

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

  @Column({ name: 'acceptance_source', nullable: true })
  acceptanceSource!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, (u) => u.termsAcceptances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => TermsVersion, (termsVersion) => termsVersion.userAcceptances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'terms_version_id' })
  termsVersion!: TermsVersion;
}
