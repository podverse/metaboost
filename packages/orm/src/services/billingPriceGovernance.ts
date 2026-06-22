import type { DataSource } from 'typeorm';

import { BILLING_PRODUCT_CODE_MEMBERSHIP_PREMIUM } from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';

const USD = 'USD';

type OpenPriceRow = {
  id: number;
  amount_cents: number;
  effective_from: Date;
  effective_to: Date | null;
};

export type ActiveBillingPriceRow = {
  id: number;
  billingProductId: number;
  productCode: string;
  currencyCode: string;
  billingCadence: 'monthly' | 'annual';
  amountCents: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  source: string;
};

export type BillingPriceWindowStatus = 'active' | 'scheduled' | 'historical';

export type BillingPriceWindowRow = ActiveBillingPriceRow & {
  status: BillingPriceWindowStatus;
};

export type BillingPriceChangeAuditRow = {
  id: number;
  billingPriceId: number | null;
  changedByManagementUserId: string | null;
  changeReason: string | null;
  previousAmountCents: number | null;
  newAmountCents: number | null;
  previousEffectiveFrom: Date | null;
  previousEffectiveTo: Date | null;
  newEffectiveFrom: Date | null;
  newEffectiveTo: Date | null;
  createdAt: Date;
  currencyCode: string | null;
  billingCadence: 'monthly' | 'annual' | null;
  productCode: string | null;
};

function classifyPriceWindow(
  effectiveFrom: Date,
  effectiveTo: Date | null,
  now: Date
): BillingPriceWindowStatus {
  if (effectiveFrom.getTime() > now.getTime()) {
    return 'scheduled';
  }
  if (effectiveTo !== null && effectiveTo.getTime() <= now.getTime()) {
    return 'historical';
  }
  return 'active';
}

/**
 * Management-only catalog mutations with `billing_price_change_audit` rows.
 */
export class BillingPriceGovernanceService {
  private readonly read: DataSource;
  private readonly readWrite: DataSource;

  constructor(params?: { dataSourceRead?: DataSource; dataSourceReadWrite?: DataSource }) {
    this.read = params?.dataSourceRead ?? appDataSourceRead;
    this.readWrite = params?.dataSourceReadWrite ?? appDataSourceReadWrite;
  }

  async listActivePrices(now = new Date()): Promise<ActiveBillingPriceRow[]> {
    const rows = (await this.read.query(
      `
      SELECT
        p.id,
        p.billing_product_id AS "billingProductId",
        bp.product_code AS "productCode",
        p.currency_code AS "currencyCode",
        p.billing_cadence AS "billingCadence",
        p.amount_cents AS "amountCents",
        p.effective_from AS "effectiveFrom",
        p.effective_to AS "effectiveTo",
        p.source
      FROM billing_price p
      INNER JOIN billing_product bp ON bp.id = p.billing_product_id
      WHERE bp.is_active = TRUE
        AND bp.product_code = $2
        AND p.effective_from <= $1
        AND (p.effective_to IS NULL OR p.effective_to > $1)
      ORDER BY bp.product_code, p.currency_code, p.billing_cadence, p.effective_from DESC
      `,
      [now, BILLING_PRODUCT_CODE_MEMBERSHIP_PREMIUM]
    )) as ActiveBillingPriceRow[];
    return rows;
  }

  /**
   * All premium membership price windows with lifecycle status relative to `now`
   * (active, scheduled future windows, closed historical rows).
   */
  async listPriceWindows(now = new Date()): Promise<BillingPriceWindowRow[]> {
    const rows = (await this.read.query(
      `
      SELECT
        p.id,
        p.billing_product_id AS "billingProductId",
        bp.product_code AS "productCode",
        p.currency_code AS "currencyCode",
        p.billing_cadence AS "billingCadence",
        p.amount_cents AS "amountCents",
        p.effective_from AS "effectiveFrom",
        p.effective_to AS "effectiveTo",
        p.source
      FROM billing_price p
      INNER JOIN billing_product bp ON bp.id = p.billing_product_id
      WHERE bp.product_code = $1
      ORDER BY p.currency_code, p.billing_cadence, p.effective_from DESC
      `,
      [BILLING_PRODUCT_CODE_MEMBERSHIP_PREMIUM]
    )) as ActiveBillingPriceRow[];

    return rows.map((row) => ({
      ...row,
      status: classifyPriceWindow(row.effectiveFrom, row.effectiveTo, now),
    }));
  }

  /** Recent price governance audit rows (newest first). */
  async listPriceChangeAudit(limit: number): Promise<BillingPriceChangeAuditRow[]> {
    const capped = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 100;
    const rows = (await this.read.query(
      `
      SELECT
        a.id,
        a.billing_price_id AS "billingPriceId",
        a.changed_by_management_user_id AS "changedByManagementUserId",
        a.change_reason AS "changeReason",
        a.previous_amount_cents AS "previousAmountCents",
        a.new_amount_cents AS "newAmountCents",
        a.previous_effective_from AS "previousEffectiveFrom",
        a.previous_effective_to AS "previousEffectiveTo",
        a.new_effective_from AS "newEffectiveFrom",
        a.new_effective_to AS "newEffectiveTo",
        a.created_at AS "createdAt",
        p.currency_code AS "currencyCode",
        p.billing_cadence AS "billingCadence",
        bp.product_code AS "productCode"
      FROM billing_price_change_audit a
      LEFT JOIN billing_price p ON p.id = a.billing_price_id
      LEFT JOIN billing_product bp ON bp.id = p.billing_product_id
      ORDER BY a.created_at DESC
      LIMIT $1
      `,
      [capped]
    )) as BillingPriceChangeAuditRow[];
    return rows;
  }

  async schedulePriceChange(params: {
    currencyCode: string;
    billingCadence: 'monthly' | 'annual';
    amountCents: number;
    effectiveFrom: Date;
    changeReason?: string | null;
    changedByManagementUserId: string | null;
    source?: string;
  }): Promise<{ newPriceId: number }> {
    const source = params.source ?? 'manual';
    const productCode = BILLING_PRODUCT_CODE_MEMBERSHIP_PREMIUM;

    return this.readWrite.transaction(async (manager) => {
      const productRows = (await manager.query(
        `SELECT id FROM billing_product WHERE product_code = $1`,
        [productCode]
      )) as Array<{ id: number }>;
      const productRow = productRows[0];
      if (productRow === undefined) {
        throw new Error('BillingPriceGovernanceService.schedulePriceChange: product missing');
      }
      const billingProductId = productRow.id;

      const openRows = (await manager.query(
        `
        SELECT id, amount_cents, effective_from, effective_to
        FROM billing_price
        WHERE billing_product_id = $1
          AND currency_code = $2
          AND billing_cadence = $3
          AND effective_to IS NULL
        `,
        [billingProductId, params.currencyCode, params.billingCadence]
      )) as OpenPriceRow[];

      const prevOpen = openRows[0];
      const effectiveFrom = params.effectiveFrom;

      if (prevOpen !== undefined) {
        await manager.query(
          `UPDATE billing_price SET effective_to = $1, updated_at = NOW() WHERE id = $2`,
          [effectiveFrom, prevOpen.id]
        );
      }

      const inserted = (await manager.query(
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
        VALUES ($1, $2, $3, $4, $5, NULL, $6)
        RETURNING id
        `,
        [
          billingProductId,
          params.currencyCode,
          params.billingCadence,
          params.amountCents,
          effectiveFrom,
          source,
        ]
      )) as Array<{ id: number }>;

      const newId = inserted[0]?.id;
      if (newId === undefined) {
        throw new Error('BillingPriceGovernanceService.schedulePriceChange: insert failed');
      }

      await manager.query(
        `
        INSERT INTO billing_price_change_audit (
          billing_price_id,
          changed_by_management_user_id,
          change_reason,
          previous_amount_cents,
          new_amount_cents,
          previous_effective_from,
          previous_effective_to,
          new_effective_from,
          new_effective_to
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          newId,
          params.changedByManagementUserId,
          params.changeReason ?? null,
          prevOpen?.amount_cents ?? null,
          params.amountCents,
          prevOpen?.effective_from ?? null,
          prevOpen?.effective_to ?? null,
          effectiveFrom,
          null,
        ]
      );

      return { newPriceId: newId };
    });
  }

  async deprecatePrice(params: {
    priceId: number;
    changeReason?: string | null;
    changedByManagementUserId: string | null;
    now?: Date;
  }): Promise<void> {
    const now = params.now ?? new Date();

    await this.readWrite.transaction(async (manager) => {
      const rows = (await manager.query(
        `
        SELECT
          p.id,
          p.amount_cents,
          p.effective_from,
          p.effective_to
        FROM billing_price p
        WHERE p.id = $1
        `,
        [params.priceId]
      )) as Array<{
        id: number;
        amount_cents: number;
        effective_from: Date;
        effective_to: Date | null;
      }>;

      const row = rows[0];
      if (row === undefined) {
        throw new Error('BillingPriceGovernanceService.deprecatePrice: price not found');
      }
      if (row.effective_to !== null && row.effective_to <= now) {
        return;
      }

      await manager.query(
        `UPDATE billing_price SET effective_to = $1, updated_at = NOW() WHERE id = $2`,
        [now, params.priceId]
      );

      await manager.query(
        `
        INSERT INTO billing_price_change_audit (
          billing_price_id,
          changed_by_management_user_id,
          change_reason,
          previous_amount_cents,
          new_amount_cents,
          previous_effective_from,
          previous_effective_to,
          new_effective_from,
          new_effective_to
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          params.priceId,
          params.changedByManagementUserId,
          params.changeReason ?? null,
          row.amount_cents,
          null,
          row.effective_from,
          row.effective_to,
          row.effective_from,
          now,
        ]
      );
    });
  }
}

export const BILLING_PRICE_GOVERNANCE_DEFAULT_CURRENCY = USD;
