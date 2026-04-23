# 05 — Verification on a real `alpha` run

## Scope

End-to-end sanity check after Phase 1 + Phase 2 + Phase 3 are merged to the
publish pipeline. This is the gate before we touch podverse.

## Verification record

- Verified run: https://github.com/podverse/metaboost/actions/runs/24857171910
- Result: success (used to mark this plan set verified and completed)

## Pre-flight

- The branch is merged into `develop`.
- `./scripts/publish/sync-develop-to-alpha.sh` is ready (or do a PR `develop` → `alpha`).
- You have rights to read GHCR and the repo's tags / releases.

## Trigger

```bash
./scripts/publish/sync-develop-to-alpha.sh
```

Watch the **Publish (alpha, beta, main)** workflow on GitHub Actions for the
resulting commit on `alpha`.

## Checklist

1. **`validate` job** completes (build / lint / type-check / audit only). The
   `Calculate unified version` step is gone.
2. **`reserve-version` job** runs after `validate`. Logs include:
   - `Reserved version: 0.1.X-staging.N`
   - `create-ref attempt: tag=... status=...` lines for each attempt.
   - On contention, one or more `422` attempt logs followed by a successful `201`
     for the winning prerelease tag.
3. **`publish-docker` matrix** uses `needs.reserve-version.outputs.version`. All
   six images push successfully with both `:0.1.X-staging.N` and `:staging` tags.
4. **`verify-published-tags`** confirms both tags exist for every app in GHCR.
5. **Git tag** `0.1.X-staging.N` exists at the workflow commit:
   ```bash
   git fetch --tags
   git show-ref --tags | grep '0.1.X-staging.N'
   ```
6. **`git-tag-staging` job is no longer in the run graph** (only true after Phase 2
   ships). If you are between phases, expect it to noop.
7. **`github-prerelease-create`** opens a GitHub Release named `0.1.X-staging.N`,
   marked as `prerelease: true`.
8. **`changelog-pr-to-develop`** opens a PR titled
   `chore: archive changelog for 0.1.X-staging.N (alpha)`. PR succeeds (no
   `Duplicate header: Authorization` errors).

## Negative tests (manual, optional)

- **Concurrent runs.** Push two empty commits to `alpha` rapidly. Both runs should
  succeed; one wins `.N` via 201, the other walks to `.N+1` via 422 retry. Both
  Git tags exist; both GHCR tag sets exist; nothing overwrites.
- **Override.** `Run workflow → version_override: 0.1.X-staging.999`. Verify the
  reserved tag is exactly `0.1.X-staging.999`.
- **Exact-tag mismatch guard.** For `version_override` (or `main` RTM), if the
   target tag already exists on a different commit, `reserve-version` must fail
   before `publish-docker` starts.

## Done criteria

When 1–8 are green and at least the "concurrent runs" negative test has been done
(or you've decided to skip it), proceed to the podverse plan set:
[`podverse/.llm/plans/active/ci-atomic-version-reservation/`](../../../../../podverse/.llm/plans/active/ci-atomic-version-reservation/00-EXECUTION-ORDER.md).
