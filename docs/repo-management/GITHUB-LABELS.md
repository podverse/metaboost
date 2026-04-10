# GitHub Labels Reference

This document lists all labels in the Boilerplate repository for consistent issue and PR management.

**Labels can be created or updated** using `./scripts/github/setup-all-labels.sh`. The script can also prompt to delete repo labels that are not defined here (deleting does not remove labels from existing issues/PRs).

## Category: Type (GitHub Defaults)

| Label         | Color   | Description                                 |
| ------------- | ------- | ------------------------------------------- |
| `bug`         | #990000 | Something isn't working                     |
| `duplicate`   | #888888 | This issue or pull request already exists   |
| `enhancement` | #00FF99 | New feature or request                      |
| `invalid`     | #999999 | This issue is invalid                       |
| `question`    | #9900FF | A question for the maintainers or community |
| `wontfix`     | #999999 | This will not be worked on                  |

## Category: Type (Custom)

| Label                   | Color   | Description                                           |
| ----------------------- | ------- | ----------------------------------------------------- |
| `technical-improvement` | #0075ca | Code quality, refactoring, optimization, architecture |
| `accessibility`         | #0d9488 | Accessibility (a11y) improvements                     |
| `documentation`         | #bfd4f2 | Documentation improvements or requests                |
| `task`                  | #7f8c8d | Task or chore                                         |
| `more info needed`      | #fbcb04 | Needs more information from the author                |
| `translations`          | #d4c5f9 | Translations and localization                         |

## Category: Code Area (Monorepo Structure)

| Label      | Color   | Description                                   | Origin     |
| ---------- | ------- | --------------------------------------------- | ---------- |
| `apps`     | #0e8a16 | Changes to apps/                              | pr-labeler |
| `packages` | #1d76db | Changes to packages/                          | pr-labeler |
| `docs`     | #fef2c0 | Changes to docs/                              | pr-labeler |
| `infra`    | #d93f0b | Changes to infra/                             | pr-labeler |
| `ci`       | #fbca04 | Changes to .github/                           | pr-labeler |
| `scripts`  | #5319e7 | Changes to scripts/                           | pr-labeler |
| `tools`    | #e99695 | Changes to tools/                             | pr-labeler |
| `i18n`     | #c5def5 | Changes to internationalization / translation | pr-labeler |

## Category: Workflow

| Label     | Color   | Description                      |
| --------- | ------- | -------------------------------- |
| `blocked` | #990099 | Work is blocked by another issue |

## Category: Security and Dependencies

| Label          | Color   | Description                            |
| -------------- | ------- | -------------------------------------- |
| `security`     | #550000 | Security vulnerabilities               |
| `dependencies` | #0366d6 | Dependency updates and security issues |
| `docker`       | #384d54 | Docker image and container updates     |

## Category: Priority

| Label               | Color   | Description                            |
| ------------------- | ------- | -------------------------------------- |
| `priority:critical` | #e11d21 | Critical priority, immediate attention |
| `priority:high`     | #eb6420 | High priority                          |
| `priority:medium`   | #d4c5f9 | Medium priority                        |
| `priority:low`      | #1f8b84 | Low priority                           |

## Label Usage by Workflow

### PR Labeler (`.github/workflows/pr-labeler.yml`)

- `apps`, `packages`, `docs`, `infra`, `ci`, `scripts`, `tools` – Applied when changed files match the path prefix
- `i18n` – Applied when paths contain `/i18n/`

Ensure labels exist before opening PRs by running `./scripts/github/setup-all-labels.sh` (see [scripts/github/SCRIPTS-GITHUB.md](../../scripts/github/SCRIPTS-GITHUB.md)).
