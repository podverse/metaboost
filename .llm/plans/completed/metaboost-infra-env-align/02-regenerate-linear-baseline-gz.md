# 02 — Regenerate linear baseline gz

## Scope

Pending changes add +39 lines to both:

- `infra/k8s/base/db/source/app/0001_app_schema.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0001_app_schema.sql`

and update `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz` (9197 → 9640 bytes).

Ops-flow check: the gz must be **generated**, not hand-edited. Follow **linear-baseline-gz-sync**
skill (MetaBoost) / Podverse `make db_regen_linear_baseline` equivalent.

## Steps

1. Identify MetaBoost make target for linear baseline regeneration (grep Makefile for `linear` /
   `baseline` / `0003a`).
2. Run regeneration after SQL sources are final.
3. Commit updated gz with matching SQL sources in same PR.
4. Operator runs CI `/test` or local `verify-linear-baseline.sh` if available.

## Verification

```bash
bash scripts/database/verify-linear-baseline.sh
```

(if script exists in MetaBoost — else use CI db-baseline step)
