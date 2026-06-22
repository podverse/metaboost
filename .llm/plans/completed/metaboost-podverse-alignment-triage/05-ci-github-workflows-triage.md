# 05 — CI / GitHub Workflows + Repo Management Triage

## Scope

This theme triages MetaBoost's continuous-integration and GitHub repo-management changes — the ops
flow around code: PR/CI gates, publish/release workflows, dependabot, labels, and branch protection.
Podverse is the reference for what the ops flow should look like.

## Changed paths

Workflows (`.github/workflows/`):

- Deleted: `llm-exports-full-sync.yml`, `llm-exports-sync.yml`, `llm-exports-optional-cloud-llm.yml`
  (these are confirmed/owned by Plan 01 — only verify they are gone from CI graph here).
- Modified: `ci.yml`, `i18n.yml`, `pr-labeler.yml`, `publish-main.yml`, `publish-staging.yml`,
  `publish-metaboost-signing.yml`.

Repo management:

- `.github/dependabot.yml`
- `scripts/github/setup-all-labels.sh`, `scripts/github/SCRIPTS-GITHUB.md`
- `docs/repo-management/BRANCH-PROTECTION.md`, `docs/repo-management/DEPENDABOT.md`,
  `docs/repo-management/GITHUB-LABELS.md`, `docs/repo-management/GITHUB-SETUP.md`
- Release docs: `docs/PUBLISH.md`, `docs/GITFLOW.md`,
  `docs/development/release/STAGING-MAIN-PROMOTION.md`,
  `docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md`

## Triage method

1. For each modified workflow, diff against the **intent** of the matching Podverse workflow under
   `podverse/.github/workflows/`. Podverse has a `github-actions-yaml` rule and a documented CI/
   publish flow; check MetaBoost's workflows follow the same conventions (job naming, concurrency,
   permissions, lint/test gates, Linux lockfile usage).
2. Confirm the publish workflows no longer reference the removed changelog system (coordinate with
   Plan 02) or the removed exports system (Plan 01).
3. Compare dependabot config, label setup, and branch-protection docs to Podverse's repo-management
   docs for parity of process.
4. Identify CI capabilities Podverse has that MetaBoost lacks (e.g. specific gates/linters/jobs) and
   record them as PARITY-GAP rows for Plan 09.

## Expected decisions

| File group                          | Decision | Notes                                                |
| ----------------------------------- | -------- | ---------------------------------------------------- |
| `ci.yml` / `i18n.yml` / `pr-labeler`| TBD      | KEEP if aligned; ALIGN if conventions drift           |
| publish-* workflows                 | TBD      | KEEP if changelog/export refs gone; ALIGN otherwise   |
| `dependabot.yml` + label scripts    | TBD      | KEEP/ALIGN vs Podverse repo-management                |
| repo-management + release docs      | TBD      | ALIGN if stale paths/process vs Podverse              |
| Podverse-only CI gates              | PARITY-GAP | record for Plan 09                                   |

## Decisions

**Executed:** 2026-06-21  
**Export/changelog in workflows:** **clean** (no `llm-exports` or `CHANGELOG` refs — Plans 01/02 confirmed).

### Deleted workflows (Plan 01)

| Path | Decision | Notes |
| --- | --- | --- |
| `llm-exports-full-sync.yml`, `llm-exports-sync.yml`, `llm-exports-optional-cloud-llm.yml` | **KEEP** | Gone; correct |

### Shared workflows (drift vs Podverse)

| Path | Decision | Notes |
| --- | --- | --- |
| `ci.yml` | **ALIGN** | MB uses GHA postgres/valkey **services** (KEEP); missing Podverse **OpenAPI check** and **npm ci retry** loop; MB adds i18n validate + type-check (KEEP) |
| `i18n.yml` | **ALIGN** | Differs; port Podverse conventions (`github-actions-yaml` rule) |
| `pr-labeler.yml` | **ALIGN** | Differs; minor — align with Podverse |
| `publish-staging.yml` | **ALIGN** | No changelog refs; port npm ci retries + reserve-version logging from Podverse |
| `publish-main.yml` | **ALIGN** | Same as staging |

### MetaBoost-only workflows

| Path | Decision | Notes |
| --- | --- | --- |
| `publish-metaboost-signing.yml` | **KEEP** | No Podverse counterpart; publish workflows clean of changelog |
| `metaboost-infra-alpha-contracts.yml` | **KEEP** | MB kustomize alpha validation; valuable |

### Podverse-only workflows (PARITY-GAP)

| Path | Decision | Notes |
| --- | --- | --- |
| `complete-feature.yml` | **ALIGN** | Also in `metaboost-llm-workspace-align` plan 04 — adopt once |
| `vulnerability-scanner.yml` | **ALIGN** | Scheduled npm audit; adopt in stage-2 |

### Repo management

| Path | Decision | Notes |
| --- | --- | --- |
| `.github/dependabot.yml` | **ALIGN** | Comment/ignore-list drift vs Podverse; same intent |
| `scripts/github/setup-all-labels.sh` | **ALIGN** | Review label set vs Podverse |
| `docs/repo-management/*` | **ALIGN** | Remove stale export/changelog refs if any |
| Release docs (`PUBLISH.md`, `GITFLOW.md`, etc.) | **KEEP** | Already no changelog system (Plan 02); minor cross-link updates only |

**Stage-2 spawned:** `.llm/plans/active/metaboost-ci-ops-align/`

**Plan 09 input:** Podverse `github-actions-yaml` rule (adopt via abcmemory-align); OpenAPI CI gate.

## Stage-2 spawn rule

If workflows/docs drift from Podverse conventions, create
`.llm/plans/active/metaboost-ci-ops-align/` with exact workflow/doc edits. Record any
Podverse-only CI gates as input to Plan 09's `metaboost-podverse-parity-gaps` set.

## Verification (for the operator, later)

```bash
diff <(ls /Users/mitcheldowney/repos/pv/metaboost/.github/workflows) <(ls /Users/mitcheldowney/repos/pv/podverse/.github/workflows)
rg -n "CHANGELOG|llm-exports" /Users/mitcheldowney/repos/pv/metaboost/.github/workflows || echo "clean"
```
