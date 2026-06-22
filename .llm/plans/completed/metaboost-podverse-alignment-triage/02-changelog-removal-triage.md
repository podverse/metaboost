# 02 — Changelog System Removal Triage

## Scope

MetaBoost maintained a manual changelog system: per-version files under
`docs/development/CHANGELOGS/`, an "upcoming"/"archive" pair under `docs/operations/`, per-package
`CHANGELOG.md` files, a `release-changelog` skill, and changelog steps inside the version bump
script. This theme triages the **removal** of that system.

Podverse (source of truth) has **no** changelog system: no `docs/development/CHANGELOGS/`, no
`release-changelog` skill. Expected outcome: MetaBoost's removal aligns and should be kept; the work
is to confirm release/publish flows no longer depend on changelogs.

## Changed paths

- `docs/development/CHANGELOGS/0.1.10.md` … `0.1.15.md` (deleted)
- `docs/operations/CHANGELOG-UPCOMING.md`, `docs/operations/CHANGELOG-ARCHIVE/*` (deleted)
- `packages/metaboost-signing/CHANGELOG.md` (deleted)
- `.cursor/skills/release-changelog/SKILL.md` (deleted)
- `scripts/publish/bump-version.sh` (modified — changelog hooks removed)
- `.cursor/skills/INDEX.md` (modified — release-changelog entry removed)
- `docs/development/DEVELOPMENT.md` (modified — changelog reference removed)

## Triage method

1. Confirm Podverse has no changelog system (already verified: true).
2. Confirm the changelog removal is internally consistent:
   - `rg -n "CHANGELOG|changelog|release-changelog" --glob '!.llm/plans/**'` across the repo.
   - Inspect `scripts/publish/bump-version.sh` and the publish workflows (`publish-main.yml`,
     `publish-staging.yml`, `publish-metaboost-signing.yml`) for any remaining changelog steps or
     references (coordinate with Plan 05, which owns those workflows).
   - Check `docs/PUBLISH.md`, `docs/GITFLOW.md`, and release runbooks for stale changelog mentions.
3. Compare MetaBoost's resulting release/version-bump flow to Podverse's (`scripts/` and publish
   workflows) to confirm parity of the "no changelog" approach.

## Expected decisions

| Path / group                       | Decision | Notes                                          |
| ---------------------------------- | -------- | ---------------------------------------------- |
| `docs/development/CHANGELOGS/**`   | KEEP     | Podverse has no changelogs                       |
| `docs/operations/CHANGELOG-*`      | KEEP     | confirm no inbound links                         |
| `packages/*/CHANGELOG.md`          | KEEP     | Podverse packages have no changelogs             |
| `release-changelog` skill          | KEEP     | confirm removed from INDEX + .cursorrules        |
| `bump-version.sh` changes          | TBD      | KEEP if clean; ALIGN if half-removed             |
| stale changelog references (if any)| ALIGN    | spawn stage-2 cleanup                            |

## Decisions

**Executed:** 2026-06-21  
**Podverse check:** No `docs/development/CHANGELOGS/`, no `release-changelog` skill (aligned).

| Path / group | Decision | Notes |
| --- | --- | --- |
| `docs/development/CHANGELOGS/**` (0.1.10–0.1.15) | **KEEP** | Gone; Podverse has no per-version changelog files |
| `docs/operations/CHANGELOG-UPCOMING.md` + archive | **KEEP** | Gone; no inbound links from active docs |
| `packages/metaboost-signing/CHANGELOG.md` | **KEEP** | Gone |
| `.cursor/skills/release-changelog` | **KEEP** | Gone; `INDEX.md` has no release-changelog entry |
| `scripts/publish/bump-version.sh` | **KEEP** | Changelog hooks removed; audit gate + version bump + Linux lockfile only |
| `docs/development/DEVELOPMENT.md` | **KEEP** | No changelog section in index |
| `docs/PUBLISH.md` | **KEEP** | GitHub Release auto-descriptions only; no file-based changelog system |
| `docs/development/release/STAGING-MAIN-PROMOTION.md` | **KEEP** | No changelog workflow refs |
| `.github/workflows/publish-*.yml` | **KEEP** | No `changelog-pr-to-develop` job in current workflows (removed; see completed `atomic-publish-version-reservation` archive) |
| Active tree `rg -i changelog` | **KEEP** | **Zero matches** outside `.llm/plans/**` and `.llm/history/**` (historical notes only) |
| `.llm/history/active/semver-changelog-workflow/` | **KEEP** | Optional human history of retired system — not operational guidance |

**Stage-2 spawned:** none — removal is complete and consistent with Podverse's no-changelog approach.

**Operator git (KEEP deletions):** Commit staged changelog deletions when bundling the alignment PR; no DISCARD rows.

## Stage-2 spawn rule

If any changelog references remain (docs, scripts, workflows), create
`.llm/plans/active/metaboost-changelog-reference-cleanup/` enumerating each and the exact edit.
Otherwise record "no stage-2 needed".

## Verification (for the operator, later)

```bash
rg -n "CHANGELOG|release-changelog" /Users/mitcheldowney/repos/pv/metaboost --glob '!.llm/plans/**' || echo "no changelog references"
```
