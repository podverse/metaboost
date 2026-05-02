# COPY-PASTA Execution Prompts

Use one prompt at a time. Do not start next phase until current phase verification passes.

## Prompt A: Implement Phase A

```text
Execute Phase A from .llm/plans/active/metaboost-podverse-alignment/02-phase-a-db-baseline-bootstrap.md.

Constraints:
- Keep diffs minimal and preserve existing runtime behavior.
- Converge metaboost baseline/bootstrap process toward podverse model.
- Replace standalone 0004 dependency by embedding deterministic migration-history rows into generated 0003a/0003b artifacts.
- Update generator, verifier, bootstrap scripts, and db kustomization wiring as needed.
- Regenerate required generated artifacts.

Required verification:
1) bash scripts/database/validate-linear-migrations.sh
2) bash scripts/database/verify-linear-baseline.sh
3) make check_k8s_postgres_init_sync

Deliverables:
- Code changes
- Generated artifact updates
- Short summary of exact files changed and why
- Any residual risk notes
```

## Prompt B: Implement Phase B

```text
Execute Phase B from .llm/plans/active/metaboost-podverse-alignment/03-phase-b-runner-k8s-ci-test.md.

Constraints:
- Align runner and k8s wrapper path/env contracts with podverse semantics.
- Align ops migration cronjobs mount/env wiring accordingly.
- Replace CI and local test DB direct schema import flows with migration-runner flows.
- Preserve current test ports and existing app behavior.

Required verification:
1) bash scripts/database/validate-linear-migrations.sh
2) bash scripts/database/verify-linear-baseline.sh
3) ./scripts/nix/with-env npm run lint
4) ./scripts/nix/with-env npm run build:packages
5) ./scripts/nix/with-env npm run type-check
6) make test_deps
7) ./scripts/nix/with-env npm run test:e2e:api

Deliverables:
- Code changes
- CI/test process summary before vs after
- Any follow-up needed for reliability
```

## Prompt C: Implement Phase C

```text
Execute Phase C from .llm/plans/active/metaboost-podverse-alignment/04-phase-c-gitops-secrets-env-docs.md across:
- `<path-to-metaboost-gitops-repo>`
- `<path-to-podverse-gitops-repo>`
- /Users/mitcheldowney/repos/pv/metaboost

Constraints:
- Enforce role-based DB key contracts.
- Add/update validation checks that require new keys and reject legacy admin keys.
- Align metaboost overlays to consume converged key names.
- Update docs to final converged process and remove transitional divergence language.

Required verification:
1) In metaboost:
	- ./scripts/nix/with-env npm run lint
	- rg -n "DB_APP_ADMIN|DB_MANAGEMENT_ADMIN|DB_APP_ADMIN_USER|DB_APP_ADMIN_PASSWORD|DB_MANAGEMENT_ADMIN_USER|DB_MANAGEMENT_ADMIN_PASSWORD" infra scripts docs apps
2) In the Podverse GitOps repository:
	- bash scripts/secret-generators/check_db_secret_contract.sh
	- rg -n "DB_APP_ADMIN|DB_MANAGEMENT_ADMIN" scripts apps argocd
3) In the Metaboost GitOps repository:
	- rg -n "DB_APP_OWNER_|DB_APP_MIGRATOR_|DB_MANAGEMENT_OWNER_|DB_MANAGEMENT_MIGRATOR_" scripts
	- rg -n "DB_APP_ADMIN|DB_MANAGEMENT_ADMIN" scripts apps argocd
4) Confirm any legacy-admin-key grep outputs above are either zero-match or explicitly remediated in the same phase.

Deliverables:
- Code and docs changes
- Per-repo checklist of completed contract alignments
- Explicit list of remaining manual ops tasks (if any)
```

## Prompt D: Final Cross-Repo Verification Pass

```text
Run a final cross-repo verification pass for metaboost alignment work.

Scope:
- /Users/mitcheldowney/repos/pv/metaboost
- `<path-to-metaboost-gitops-repo>`
- `<path-to-podverse-gitops-repo>`

Validate:
1) Migration/baseline contracts
2) K8s migration job wiring
3) CI/local test DB-init process parity
4) Secret/env key naming convergence and contract checks
5) Documentation and guardrail completeness

Output:
- PASS/FAIL matrix by area
- Blocking issues with exact file paths
- Ordered next actions to reach full convergence
```

## Prompt E: Unstaged Parity Audit + Remediation

```text
Execute Phase D from .llm/plans/active/metaboost-podverse-alignment/05-unstaged-parity-audit-and-remediation.md.

Scope:
- Current unstaged metaboost changes first
- Then linked metaboost key-contract surfaces in the Metaboost GitOps repository and operator GitOps repos if needed

Requirements:
1) Produce PASS/FAIL against each checklist item in Phase D.
2) If any item is FAIL, patch files now (minimal safe diffs) toward podverse parity.
3) Prefer canonical single-source scripts over duplicated copies.
4) Keep generated artifacts generated, not hand-edited.

Required verification:
1) bash scripts/database/validate-linear-migrations.sh
2) bash scripts/database/verify-linear-baseline.sh
3) make check_k8s_postgres_init_sync
4) ./scripts/nix/with-env npm run lint
5) ./scripts/nix/with-env npm run build

If CI/test DB-init paths changed:
6) make test_deps
7) ./scripts/nix/with-env npm run test:e2e:api

Deliverables:
- PASS/FAIL matrix with exact file paths
- All remediation edits applied
- Residual deltas explicitly listed as TODOs
```

## Prompt F: Ingest Podverse Last-24h Changes

```text
Execute Phase E from .llm/plans/active/metaboost-podverse-alignment/06-podverse-last-24h-commit-ingest.md.

Requirements:
1) Prioritize newest podverse commits first.
2) Convert each commit item into concrete metaboost alignment edits or explicit TODO blockers.
3) Keep metaboost parity target anchored to current podverse contracts, not older assumptions.

Minimum deliverables:
1) Per-commit mapping: podverse change -> metaboost file(s) to align
2) Edits applied for non-blocked items
3) Updated PASS/FAIL matrix with remaining gaps

Required verification:
1) bash scripts/database/validate-linear-migrations.sh
2) bash scripts/database/verify-linear-baseline.sh
3) make check_k8s_postgres_init_sync
4) ./scripts/nix/with-env npm run lint
5) ./scripts/nix/with-env npm run build
6) ! rg -n "CREATE[[:space:]]+EXTENSION" apps packages --glob '!**/*.md'

Optional (run if these scripts are added during Phase E):
7) bash scripts/database/ci-verify-bootstrap-contract.sh
8) bash scripts/database/check-no-runtime-create-extension.sh
```
