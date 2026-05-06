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

  @Column({ name: 'billing_cadence', type: 'varchar', length: 16, nullable: true })
  billingCadence!: string | null;

  @Column({ name: 'auto_renew_mode', type: 'varchar', length: 16, default: 'off' })
  autoRenewMode!: 'off' | 'on';

  @Column({ name: 'next_renewal_attempt_at', type: 'timestamp', nullable: true })
  nextRenewalAttemptAt!: Date | null;

  @Column({ name: 'last_renewal_attempt_at', type: 'timestamp', nullable: true })
  lastRenewalAttemptAt!: Date | null;

  @Column({ name: 'last_renewal_status', type: 'varchar', length: 16, default: 'none' })
  lastRenewalStatus!: string;

  @Column({ name: 'last_extension_idempotency_key', type: 'varchar', length: 128, nullable: true })
  lastExtensionIdempotencyKey!: string | null;

  @Column({ name: 'last_renewal_idempotency_key', type: 'varchar', length: 128, nullable: true })
  lastRenewalIdempotencyKey!: string | null;

  @Column({ name: 'renewal_retry_count', type: 'integer', default: 0 })
  renewalRetryCount!: number;

  @Column({ name: 'renewal_retry_backoff_until', type: 'timestamp', nullable: true })
  renewalRetryBackoffUntil!: Date | null;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToOne('User', (u: User) => u.trustSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
