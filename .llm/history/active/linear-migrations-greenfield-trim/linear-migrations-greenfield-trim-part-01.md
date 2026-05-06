## Started

**Author:** Cursor agent  
**Context:** Trim redundant greenfield linear SQL migrations after assessment.

### Session 1 - 2026-05-06

#### Prompt (Developer)

assess the sql files in metaboost. are any unnecessary? you can remove them and change the numbers if it looks like any are not truly needd. assume a green field environment

#### Key Decisions

- **App:** Removed no-op `0002_bucket_settings_public_boost_display_minimum.sql` (`SELECT 1` only; column already in 0001).
- **App:** Dropped `0005_remove_user_trust_tier.sql` by creating `user_trust_settings` without `trust_tier_id` in `0003_user_trust_and_entitlement_overrides.sql` (greenfield never introduces the column).
- **App:** Renumbered chain to five files: `0002_terms_default_seed.sql`, `0003_user_trust_and_entitlement_overrides.sql`, `0004_billing_catalog_and_trust_renewal.sql`, `0005_billing_domain_events.sql`.
- **Management:** Folded `0006_billing_prices_permissions.sql` into `0001_management_schema.sql` (`billing_prices_crud` on `admin_permissions` and `management_admin_role`); deleted standalone `0006`.
- **Ops:** Updated `infra/k8s/base/ops/kustomization.yaml`, `API_EXPECTED_MIGRATION_FILENAME` → `0005_billing_domain_events.sql`, `MANAGEMENT_API_EXPECTED_MIGRATION_FILENAME` → `0001_management_schema.sql`.
- Regenerated `0003a_app_linear_baseline.sql.gz` and `0003b_management_linear_baseline.sql.gz`; ran `validate-linear-migrations.sh` and `verify-linear-baseline.sh`.

#### Files Created/Modified

- `infra/k8s/base/ops/source/database/linear-migrations/management/0001_management_schema.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0002_terms_default_seed.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0003_user_trust_and_entitlement_overrides.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0004_billing_catalog_and_trust_renewal.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0005_billing_domain_events.sql`
- Removed obsolete app/management migration files listed in decisions above
- `infra/k8s/base/ops/kustomization.yaml`
- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/management-api/source/management-api.env`
- `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`
- `infra/k8s/base/db/source/bootstrap/0003b_management_linear_baseline.sql.gz`
- `.llm/history/active/linear-migrations-greenfield-trim/linear-migrations-greenfield-trim-part-01.md`
