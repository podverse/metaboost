---
name: git-worktree-sibling
description: Create and use Metaboost git worktrees in sibling directories named metaboost_<branch_slug> (underscores). Use when starting feature work, moving WIP off the main checkout, or opening the correct worktree path for a branch.
---

# Git worktree — sibling directories

## When to use

- Starting or continuing work on a **feature branch** without leaving `metaboost` on `develop`.
- Moving in-progress changes out of the primary checkout into a dedicated directory.
- Telling the agent **which folder** to edit for a given branch.

## Layout

| Role                                 | Path                                                     |
| ------------------------------------ | -------------------------------------------------------- |
| Primary checkout (stay on `develop`) | `/Users/mitcheldowney/repos/pv/metaboost`                |
| Parent of all worktrees              | `/Users/mitcheldowney/repos/pv/`                         |
| Feature worktree                     | `/Users/mitcheldowney/repos/pv/metaboost_<branch_slug>/` |

Worktrees are **siblings** of `metaboost`, not subdirectories inside it.

## Directory naming (canonical)

```text
metaboost_<branch_slug>
```

Derive `<branch_slug>` from the git branch name:

1. Replace every `/` with `_`
2. Replace every `-` with `_`

Examples:

| Branch                       | Worktree directory                     |
| ---------------------------- | -------------------------------------- |
| `feature/billing-membership` | `metaboost_feature_billing_membership` |
| `chore/typeorm-v1`           | `metaboost_chore_typeorm_v1`           |
| `llm/cursor-hooks`           | `metaboost_llm_cursor_hooks`           |

## Create a worktree

Run from the primary repo. The branch must **not** be checked out in `metaboost`.

```bash
cd /Users/mitcheldowney/repos/pv/metaboost
git checkout develop
git worktree add ../metaboost_feature_my_feature feature/my-feature
```

Create a new branch at the same time:

```bash
git worktree add -b feature/my-feature ../metaboost_feature_my_feature develop
cd ../metaboost_feature_my_feature
make local_env_setup
./scripts/nix/with-env npm install
```

## Move WIP from primary checkout into a worktree

```bash
cd /Users/mitcheldowney/repos/pv/metaboost
git stash push -u -m "feature-name wip"
git checkout develop
git worktree add ../metaboost_feature_my_feature feature/my-feature
cd ../metaboost_feature_my_feature
make local_env_setup
git stash pop
```

Use `git stash push -u` so **untracked** files (e.g. `.llm/plans/active/...`) move with the stash.

## Daily workflow

- **Edit feature code** in the sibling worktree (`metaboost_*`), not in `metaboost` unless on `develop`.
- **Commands** run from that worktree's root: `./scripts/nix/with-env npm run lint`, `make e2e_test_web_report_spec`, etc.
- **First-time env in a worktree:** `make local_env_setup` (and `make local_env_link` if using home overrides).

List worktrees:

```bash
cd /Users/mitcheldowney/repos/pv/metaboost
git worktree list
```

## Remove a worktree

```bash
cd /Users/mitcheldowney/repos/pv/metaboost
git worktree remove ../metaboost_feature_my_feature
git worktree prune
```

## Agent rules

1. Before editing files, confirm **which worktree** matches the user's branch (`git worktree list` or ask).
2. Do **not** implement feature work on `metaboost` while it is on `develop` if a sibling worktree exists for that branch.
3. When the user names a branch, resolve the directory as `metaboost_<branch_slug>` under `repos/pv/`.
4. Plans for deferred work live under `.llm/plans/active/` in the **worktree** that owns the feature branch.

## Related

- [DOCS-DEVELOPMENT-LLM.md](/docs/development/llm/DOCS-DEVELOPMENT-LLM.md)
- **nix-terminal-wrapper** rule — `./scripts/nix/with-env` from worktree root
