import type { User } from './User.js';

import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity('user_trust_settings')
export class UserTrustSettings {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ name: 'membership_tier', type: 'varchar', length: 32, default: 'trial' })
  membershipTier!: string;

  @Column({ name: 'membership_expires_at', type: 'timestamp', nullable: true })
  membershipExpiresAt!: Date | null;

  @Column({ name: 'auto_renew', type: 'boolean', default: false })
  autoRenew!: boolean;

  @Column({ name: 'trust_tier_id', type: 'int', default: 1 })
  trustTierId!: number;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToOne('User', (u: User) => u.trustSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
