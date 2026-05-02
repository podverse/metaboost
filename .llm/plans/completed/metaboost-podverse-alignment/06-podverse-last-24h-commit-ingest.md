# Phase E: Podverse Last-24h Commit Ingest (Newest First)

Goal: pull the most recent podverse process changes into metaboost alignment work so metaboost converges toward the current podverse contract, not a stale snapshot.

Window scanned: last 24 hours in podverse monorepo (2026-04-29 to 2026-04-30).

## Priority queue (newest first)

1. 79c14a0 - pin workers image in alpha ops overlays
- Why it matters: prevents unpinned image drift and pull failures in ops overlays.
- Metaboost alignment tasks:
  - Audit metaboost ops overlay image pins for workers-like workloads.
  - Pin image tags/digests where drift risk exists.
  - Add docs/runbook note explaining pin policy for ops overlays.

2. 0906c8a - remove standalone 0004 seed dependency; strengthen baseline verification
- Why it matters: this is core DB bootstrap parity and directly impacts metaboost contract alignment.
- Metaboost alignment tasks:
  - Fully remove reliance on `0004_seed_linear_migration_history.sql`.
  - Ensure deterministic migration-history rows are emitted into generated `0003a` and `0003b` baselines.
  - Tighten baseline verification to assert deterministic reference rows.

3. 0a87121 - improve bootstrap grants and verifier correctness
- Why it matters: avoids false-negative contract checks and normalizes grants behavior.
- Metaboost alignment tasks:
  - Mirror conditional schema-usage grants in bootstrap scripts.
  - Align bootstrap contract verifier queries to `pg_catalog.pg_tables` style where relevant.
  - Ensure local bootstrap creates required extensions in both app and management DBs where podverse now requires it.

4. e393bd3 / d12486e / 1be823a - bootstrap contract verification in CI + runtime CREATE EXTENSION guard
- Why it matters: enforces non-regression and prevents extension setup from leaking into runtime app code paths.
- Metaboost alignment tasks:
  - Add/align CI bootstrap-contract verification script and CI job wiring.
  - Add/align a no-runtime-`CREATE EXTENSION` guard script and CI gate.
  - Add manual/suspended K8s verification cronjob equivalent if operationally useful.

5. a0306d7 - split baseline model (`0003a`/`0003b`) and apply script guardrails
- Why it matters: this remains foundational and is still in active refinement in podverse.
- Metaboost alignment tasks:
  - Keep split baseline model and apply-script workflow synchronized with podverse expectations.
  - Keep baseline generation/verification scripts in parity with podverse contract checks.

## Integration notes for existing phases

1. Fold item #2 and #5 into Phase A and Phase D remediation gates.
2. Fold item #3 and #4 into Phase B acceptance criteria and verification commands.
3. Fold item #1 into Phase C for GitOps/ops-overlay parity (image pin policy).

## Verification additions

Add these checks to metaboost parity runs:

```bash
make check_k8s_postgres_init_sync
./scripts/nix/with-env npm run lint
./scripts/nix/with-env npm run build
! rg -n "CREATE[[:space:]]+EXTENSION" apps packages --glob '!**/*.md'
```

If bootstrap-contract/extension-guard scripts are added, run them as additional checks:

```bash
bash scripts/database/ci-verify-bootstrap-contract.sh
bash scripts/database/check-no-runtime-create-extension.sh
```

If K8s verification cronjob is adopted, include validation of manifest presence and suspend/default policy.
