import type { DataSource } from 'typeorm';

import {
  BILLING_PRODUCT_CODE_MEMBERSHIP_PREMIUM,
  resolveProductMembershipDefaultsFromEnv,
  type ResolvedProductMembership,
} from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { ProductMembershipSettingsService } from './productMembershipSettings.js';

type ActivePricingRow = {
  billing_cadence: 'monthly' | 'annual';
  amount_cents: number;
};

const PREMIUM_PRODUCT_CODE = BILLING_PRODUCT_CODE_MEMBERSHIP_PREMIUM;
const USD_CURRENCY_CODE = 'USD';

export class BillingPriceCatalogService {
  private dataSourceRead: DataSource;
  private dataSourceReadWrite: DataSource;

  constructor(params?: { dataSourceRead?: DataSource; dataSourceReadWrite?: DataSource }) {
    this.dataSourceRead = params?.dataSourceRead ?? appDataSourceRead;
    this.dataSourceReadWrite = params?.dataSourceReadWrite ?? appDataSourceReadWrite;
  }

  private async getActivePremiumPricingRows(now: Date): Promise<ActivePricingRow[]> {
    const rows = await this.dataSourceRead.query(
      `
      SELECT DISTINCT ON (p.billing_cadence)
        p.billing_cadence,
        p.amount_cents
      FROM billing_price p
      INNER JOIN billing_product bp
        ON bp.id = p.billing_product_id
      WHERE bp.product_code = $1
        AND bp.is_active = TRUE
        AND p.currency_code = $2
        AND p.effective_from <= $3
        AND (p.effective_to IS NULL OR p.effective_to > $3)
      ORDER BY p.billing_cadence, p.effective_from DESC
      `,
      [PREMIUM_PRODUCT_CODE, USD_CURRENCY_CODE, now]
    );

    return rows as ActivePricingRow[];
  }

  async ensureProductMembershipTrialSeededFromEnv(now = new Date()): Promise<void> {
    await ProductMembershipSettingsService.ensureSingletonSeededFromEnv(now);
  }

  async ensurePremiumPricingSeededFromEnv(now = new Date()): Promise<void> {
    const envDefaults = resolveProductMembershipDefaultsFromEnv();
    const monthlyAmountCents = Math.round(envDefaults.premiumMembershipCostMonthly * 100);
    const annualAmountCents = Math.round(envDefaults.premiumMembershipCostAnnually * 100);

    await this.dataSourceReadWrite.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(
        `
        INSERT INTO billing_product (product_code, name, is_active)
        SELECT $1, $2, TRUE
        WHERE NOT EXISTS (
          SELECT 1
          FROM billing_product
          WHERE product_code = $1
        )
        `,
        [PREMIUM_PRODUCT_CODE, 'Premium Membership']
      );

      const rows = (await transactionalEntityManager.query(
        `
        SELECT DISTINCT ON (p.billing_cadence)
          p.billing_cadence,
          p.amount_cents
        FROM billing_price p
        INNER JOIN billing_product bp
          ON bp.id = p.billing_product_id
        WHERE bp.product_code = $1
          AND bp.is_active = TRUE
          AND p.currency_code = $2
          AND p.effective_from <= $3
          AND (p.effective_to IS NULL OR p.effective_to > $3)
        ORDER BY p.billing_cadence, p.effective_from DESC
        `,
        [PREMIUM_PRODUCT_CODE, USD_CURRENCY_CODE, now]
      )) as ActivePricingRow[];

      const hasMonthly = rows.some((row) => row.billing_cadence === 'monthly');
      const hasAnnual = rows.some((row) => row.billing_cadence === 'annual');

      if (!hasMonthly) {
        await transactionalEntityManager.query(
          `
          INSERT INTO billing_price (
            billing_product_id,
            currency_code,
            billing_cadence,
            amount_cents,
            effective_from,
            effective_to,
            source
          )
          SELECT id, $1, $2, $3, $4, NULL, 'env_bootstrap'
          FROM billing_product
          WHERE product_code = $5
          `,
          [USD_CURRENCY_CODE, 'monthly', monthlyAmountCents, now, PREMIUM_PRODUCT_CODE]
        );
      }

      if (!hasAnnual) {
        await transactionalEntityManager.query(
          `
          INSERT INTO billing_price (
            billing_product_id,
            currency_code,
            billing_cadence,
            amount_cents,
            effective_from,
            effective_to,
            source
          )
          SELECT id, $1, $2, $3, $4, NULL, 'env_bootstrap'
          FROM billing_product
          WHERE product_code = $5
          `,
          [USD_CURRENCY_CODE, 'annual', annualAmountCents, now, PREMIUM_PRODUCT_CODE]
        );
      }
    });
  }

  async resolveProductMembership(now = new Date()): Promise<ResolvedProductMembership> {
    const envDefaults = resolveProductMembershipDefaultsFromEnv();

    await this.ensurePremiumPricingSeededFromEnv(now);
    await this.ensureProductMembershipTrialSeededFromEnv(now);

    const rows = await this.getActivePremiumPricingRows(now);
    const settingsRow = await ProductMembershipSettingsService.findSingleton();
    const monthlyRow = rows.find((row) => row.billing_cadence === 'monthly');
    const annualRow = rows.find((row) => row.billing_cadence === 'annual');

    return {
      ...envDefaults,
      freeTrialExpirationSeconds:
        settingsRow !== null
          ? settingsRow.freeTrialExpirationSeconds
          : envDefaults.freeTrialExpirationSeconds,
      premiumMembershipCostMonthly:
        monthlyRow !== undefined
          ? Number((monthlyRow.amount_cents / 100).toFixed(2))
          : envDefaults.premiumMembershipCostMonthly,
      premiumMembershipCostAnnually:
        annualRow !== undefined
          ? Number((annualRow.amount_cents / 100).toFixed(2))
          : envDefaults.premiumMembershipCostAnnually,
    };
  }
}
