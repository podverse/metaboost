---
name: release-changelog
description: "Keep the upcoming release note buffer updated on develop; ties into publish-staging and publish-main (RTM) and GitHub release/archive automation."
---

# Release changelog (Metaboost)

## When to use

When you ship or finish work that is **worth calling out** in preprod/prod release notes: behavior changes, new surfaces, important fixes, or ops-impacting updates—not every internal cleanup.

## What to update

- Edit [docs/operations/CHANGELOG-UPCOMING.md](../../docs/operations/CHANGELOG-UPCOMING.md) on **`develop` only** (promotion branches are triggers only—see [PUBLISH.md](../../PUBLISH.md)).

## Conventions

1. **Order** — **Most important first** (safety, security, data, then big features, then smaller fixes; skip low-signal items).
2. **Wording** — Short, clear lines; link issues/PRs if useful.
3. **Markers** — Put new bullets between `UPCOMING-AUTO-START` and `UPCOMING-AUTO-END` so post-publish automation can reset that block via PR. Notes **above** the block are not auto-cleared.
4. **Brevity** — Concise, not a duplicate of git log.

## Naming in CI

- Git branch **`staging`** runs **Publish (staging)**: **`X.Y.Z-staging.N`** and float **`staging`** in GHCR. Cluster “alpha” in GitOps (path/namespace) is separate.
- Pushes to **`main`** run **Publish (main)**: promote to RTM **`X.Y.Z`** and **`:prod`**.

## Related

- [PUBLISH.md](../../PUBLISH.md) — full publish flow, Git tag, and GitOps pins.
