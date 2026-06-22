import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BillingProduct } from './BillingProduct.js';

@Entity('billing_price')
export class BillingPrice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'billing_product_id', type: 'integer' })
  billingProductId!: number;

  @ManyToOne(() => BillingProduct, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billing_product_id' })
  billingProduct!: BillingProduct;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode!: string;

  @Column({ name: 'billing_cadence', type: 'varchar', length: 16 })
  billingCadence!: 'monthly' | 'annual';

  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents!: number;

  @Column({ name: 'effective_from', type: 'timestamp' })
  effectiveFrom!: Date;

  @Column({ name: 'effective_to', type: 'timestamp', nullable: true })
  effectiveTo!: Date | null;

  @Column({ type: 'varchar', length: 32, default: 'manual' })
  source!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
