# 01 — Schema migrations

## Scope

Replace `user_trust_settings` with `user_membership` in the linear migration chain. Fold billing-renewal columns from `0004` into the `0003` `CREATE TABLE`. No ALTER-rename migration.

## Steps

1. **Replace** `infra/k8s/base/ops/source/database/linear-migrations/app/0003_user_trust_and_entitlement_overrides.sql` with `0003_user_membership.sql`:
   - `CREATE TABLE user_membership` with all membership + renewal columns
   - Constraints `chk_user_membership_*`
   - Trigger `set_updated_at_user_membership`
   - Backfill `INSERT INTO user_membership ... SELECT ... FROM "user"`
   - Indexes `idx_user_membership_next_renewal_attempt_at`, `idx_user_membership_renewal_retry_backoff_until`

2. **Replace** `0004_billing_catalog_and_trust_renewal.sql` with `0004_billing_catalog_and_membership_renewal.sql`:
   - Keep billing catalog tables and seeds
   - Remove `ALTER TABLE user_trust_settings` and trust-named indexes

3. **Update** [infra/k8s/base/ops/kustomization.yaml](infra/k8s/base/ops/kustomization.yaml) ConfigMap file list for the two new filenames.

4. **Regenerate baseline** (operator or agent with Nix):

```bash
bash scripts/database/generate-linear-baseline.sh
```

Commit `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`.

## Key files

- `infra/k8s/base/ops/source/database/linear-migrations/app/0003_user_membership.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0004_billing_catalog_and_membership_renewal.sql`
- `infra/k8s/base/ops/kustomization.yaml`
- `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`

## Verification

```bash
bash scripts/database/validate-linear-migrations.sh
bash scripts/database/verify-linear-baseline.sh
gunzip -c infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz | rg user_membership
```

Expect `user_membership` in baseline; no `user_trust_settings`.
