# 03 — Metaboost completed plans (stale targets)

Editorial fixes in archived plans — not auto-convertible.

## atomic-publish-version-reservation (9 links)

Replace `../../../../.github/workflows/publish-alpha.yml` with:

`/github/workflows/publish-staging.yml` (or `publish-main.yml` if context is production).

Add short note: `publish-alpha.yml` was renamed/removed.

Files:

- `01-reserve-version-job.md`
- `02-rewire-needs-and-outputs.md`
- `03-remove-git-tag-staging-and-validate-version.md`
- `04-docs-publish-update.md`

## canonical-terms-bootstrap (4 links)

- `0008_seed_local_terms_version.sql` — map to current bootstrap/migration path under `infra/k8s/base/db/` or link `/cursor/skills/linear-db-migrations/SKILL.md` if file was removed.
- `infra/k8s/base/stack/kustomization.yaml` — use `/infra/k8s/base/db/kustomization.yaml` or remove if obsolete.

Files: `00-SUMMARY.md`, `01-infra-canonical-bootstrap.md`

## tiered-import-specifiers (1 link)

`05-documentation-skills-rules.md`: remove link to `../../../../.llm/exports/`; prose only (exports prohibited).

## Cross-repo (1 link)

`atomic-publish-version-reservation/05-verification.md`: replace markdown link to `podverse/.llm/...` with plain text (no in-repo href).
