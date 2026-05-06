import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('product_membership_settings')
export class ProductMembershipSettings {
  @PrimaryColumn({ type: 'integer', default: 1 })
  id!: number;

  @Column({ name: 'free_trial_expiration_seconds', type: 'integer' })
  freeTrialExpirationSeconds!: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
