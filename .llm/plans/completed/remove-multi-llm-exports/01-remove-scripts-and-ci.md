# Plan 01 — Remove scripts and CI (Metaboost)

## Objective

Delete the deterministic export pipeline and all CI that publishes `.llm/exports/` mirrors.

## Scope

Metaboost repo root: `/Users/mitcheldowney/repos/pv/metaboost`

## Steps

### 1. Delete `scripts/llm/` entirely

Same 8-file layout as Podverse — remove the whole `scripts/llm/` directory.

### 2. Delete GitHub Actions workflows

Remove:

- `.github/workflows/llm-exports-sync.yml`
- `.github/workflows/llm-exports-full-sync.yml`
- `.github/workflows/llm-exports-optional-cloud-llm.yml`

### 3. Remove npm scripts from root `package.json`

Delete: `llm:exports:sync`, `llm:exports:sync:full`, `llm:exports:check`, `llm:exports:restore`, `llm:vendors`.

### 4. Remove pre-commit export guard

In `scripts/git-hooks/pre-commit`, remove the `GUARD_EXPORTS` / `guard-exports-prompt.sh` block.

### 5. Remove `llm` label from PR labeler

In `.github/workflows/pr-labeler.yml`, remove the line adding label `llm` for `.cursor/**` changes.

### 6. Optional: remove `llm` label from `scripts/github/setup-all-labels.sh`

## Verification

```bash
test ! -d scripts/llm
test ! -f .github/workflows/llm-exports-sync.yml
```

## Acceptance checklist

- [ ] `scripts/llm/` gone
- [ ] Three export workflows gone
- [ ] Five npm scripts removed
- [ ] Pre-commit guard removed
- [ ] PR labeler updated
