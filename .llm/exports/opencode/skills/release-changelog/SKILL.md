---
name: release-changelog
description: "Use version-first changelog files (docs/development/CHANGELOGS/X.Y.Z.md): bump version at start of work and write release notes continuously for staging and main releases."
---


# Release changelog (Metaboost)

## When to use

When you ship or finish work that is **worth calling out** in preprod/prod release notes: behavior changes, new surfaces, important fixes, or ops-impacting updates—not every internal cleanup.

## What to update

- Use [docs/development/CHANGELOGS/X.Y.Z.md](../../docs/development/CHANGELOGS/) where `X.Y.Z` is the current base version in `package.json`.
- Bump version **at the start of work** with `scripts/publish/bump-version.sh` so `docs/development/CHANGELOGS/X.Y.Z.md` exists before implementation.
- Keep updating that same semver file continuously as work lands.

## Conventions

1. **Order** — **Most important first** (safety, security, data, then big features, then smaller fixes; skip low-signal items).
2. **Wording** — Short, clear lines; link issues/PRs if useful.
3. **Single source** — Staging prereleases and main production releases both read the same `X.Y.Z.md` file.
4. **Brevity** — Concise, not a duplicate of git log.

## Naming in CI

- Git branch **`staging`** runs **Publish (staging)**: **`X.Y.Z-staging.N`** and float **`staging`** in GHCR. Cluster “alpha” in GitOps (path/namespace) is separate.
- Pushes to **`main`** run **Publish (main)**: promote to RTM **`X.Y.Z`** and **`:latest`**.

## Related

- [PUBLISH.md](../../PUBLISH.md) — full publish flow, Git tag, and GitOps pins.
