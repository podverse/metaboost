### Session 1 - 2026-04-25

#### Prompt (Developer)

fix, and fix metaboost if you anticipate similar issue

#### Key Decisions

- Mirror Podverse hardening in Metaboost publish sync scripts to prevent branch/tag ambiguity (`staging` branch vs `refs/tags/staging`).
- Replace short ref usage with explicit `refs/heads/...` branch refs across checkout, pull, merge-base, merge, rev-parse, and push operations.
- Keep current moving tag workflow (`refs/tags/staging`, `refs/tags/latest`) but document operational requirement to use fully-qualified refs.

#### Files Modified

- scripts/publish/sync-develop-to-staging.sh
- scripts/publish/sync-staging-to-main.sh
- scripts/publish/sync-develop-to-beta.sh
- docs/PUBLISH.md

### Session 2 - 2026-04-25

#### Prompt (Developer)

fix it and make sure metaboost is fixed as well

#### Key Decisions

- Adjust script strategy to avoid detached HEAD and refspec non-fast-forward pull failures:
  - use `git switch <branch>` instead of checking out fully-qualified refs directly;
  - fast-forward local branches from remotes with `git merge --ff-only refs/remotes/origin/<branch>`.
- Retain fully-qualified refs for merge-base and rev-parse checks to avoid branch/tag ambiguity.

#### Files Modified

- scripts/publish/sync-develop-to-staging.sh
- scripts/publish/sync-staging-to-main.sh
- scripts/publish/sync-develop-to-beta.sh
