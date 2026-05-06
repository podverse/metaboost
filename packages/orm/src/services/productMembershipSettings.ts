import { resolveProductMembershipDefaultsFromEnv } from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { ProductMembershipSettings } from '../entities/ProductMembershipSettings.js';

/**
 * Canonical one-row settings (`id = 1`) for premium membership product defaults.
 * Env is used only to bootstrap an empty row; existing DB values are never overwritten.
 */
export class ProductMembershipSettingsService {
  static async findSingleton(): Promise<ProductMembershipSettings | null> {
    return appDataSourceRead.getRepository(ProductMembershipSettings).findOne({
      where: { id: 1 },
    });
  }

  /**
   * Insert row 1 from env when missing (`ON CONFLICT DO NOTHING`). Does not update existing rows.
   */
  static async ensureSingletonSeededFromEnv(now = new Date()): Promise<void> {
    const envDefaults = resolveProductMembershipDefaultsFromEnv();
    await appDataSourceReadWrite.query(
      `
      INSERT INTO product_membership_settings (
        id,
        free_trial_expiration_seconds,
        created_at,
        updated_at
      )
      VALUES (1, $1, $2, $2)
      ON CONFLICT (id) DO NOTHING
      `,
      [envDefaults.freeTrialExpirationSeconds, now]
    );
  }
}
