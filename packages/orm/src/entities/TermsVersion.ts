import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserTermsAcceptance } from './UserTermsAcceptance.js';

export type TermsVersionStatus = 'draft' | 'scheduled' | 'active' | 'retired';

@Entity('terms_version')
export class TermsVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'version_key', unique: true })
  versionKey!: string;

  @Column({ name: 'title' })
  title!: string;

  @Column({ name: 'content_hash' })
  contentHash!: string;

  @Column({ name: 'announcement_starts_at', type: 'timestamp', nullable: true })
  announcementStartsAt!: Date | null;

  @Column({ name: 'effective_at', type: 'timestamp' })
  effectiveAt!: Date;

  @Column({ name: 'enforcement_starts_at', type: 'timestamp' })
  enforcementStartsAt!: Date;

  @Column({ name: 'status' })
  status!: TermsVersionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => UserTermsAcceptance, (acceptance) => acceptance.termsVersion)
  userAcceptances!: UserTermsAcceptance[];
}
