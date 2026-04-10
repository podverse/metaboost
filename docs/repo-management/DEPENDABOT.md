# Dependabot Configuration

This document explains the automated dependency update system using GitHub Dependabot. The
config is aligned with the [Podverse monorepo](https://github.com/podverse/podverse)
Dependabot setup and scoped to this repo’s structure.

## Overview

Dependabot automatically creates pull requests to keep dependencies up-to-date and secure.
Configuration is in [`.github/dependabot.yml`](../../.github/dependabot.yml).

## Update Schedule

**Weekly on Mondays at 8:00 AM Central Time (America/Chicago)**

All dependency checks run on this schedule to batch updates and reduce review overhead.

## Ecosystem Coverage

### 1. npm Dependencies (Root)

**Directory**: `/` (root `package.json` and npm workspaces)

**Grouping** (same as Podverse):

- **production-minor-patch**: Minor and patch production updates (excludes `@types/*`,
  `eslint*`, `typescript`)
- **typescript-ecosystem**: TypeScript, `@types/*`, and ESLint updates together
- **dev-dependencies**: Dev dependency minor/patch updates

**Labels**: `dependencies`

**PR limit**: 10 concurrent PRs

**Node.js**: Only Node LTS **≥ 24** (even versions). `@types/node` updates for pre-24 or
odd versions (18.x–23.x, 25.x, 27.x, 29.x) are ignored.

### 2. Docker Images

**Directories** (under `infra/docker/local/`):

- `api`
- `web`
- `web-sidecar`
- `management-api`
- `management-web`

**Labels**: `dependencies`, `docker`

**Node.js LTS policy (≥ 24 only)**:

- Allowed: even-numbered LTS **24 and above** (24.x, 26.x, 28.x, …)
- Ignored: pre-24 (18.x–23.x) and odd (non-LTS) versions (25.x, 27.x, 29.x)

> **Why?** Node LTS versions are even-numbered. This repo uses Node 24+ only; Docker
> image updates are restricted to that policy.

**Ignored versions in config**: `18.x`, `19.x`, `20.x`, `21.x`, `22.x`, `23.x`, `25.x`,
`27.x`, `29.x`

### 3. GitHub Actions

**Directory**: `/` (`.github/workflows/`)

**Labels**: `dependencies`

The PR labeler may also add `ci` when paths under `.github/` change. Keep `node-version`
in workflow files on LTS (even: 24, 26, …); set these manually.

## Labels

| Label          | Applied to         | Applied by |
| -------------- | ------------------ | ---------- |
| `dependencies` | All Dependabot PRs | Dependabot |
| `docker`       | Docker image PRs   | Dependabot |
| `ci`           | Actions updates    | PR Labeler |
| `infra`        | Docker (infra/\*)  | PR Labeler |

See [GITHUB-LABELS.md](GITHUB-LABELS.md) for the full label reference.

## Node.js Version Policy

**Minimum: Node.js 24 LTS**

- Docker images and tooling use **Node LTS ≥ 24** (even versions only).
- Odd-numbered majors (25, 27, 29…) are never LTS and are ignored by Dependabot.

**References**: [Node.js release schedule](https://github.com/nodejs/release#release-schedule)

## First-Time Setup

Ensure labels exist so Dependabot can apply them:

```bash
./scripts/github/setup-all-labels.sh
```

See [GITHUB-SETUP.md](GITHUB-SETUP.md) for one-time repo setup.

## Handling Dependabot PRs

1. **Check CI** – Ensure `validate` (and any other checks) pass.
2. **Review** – Prefer grouped PRs; check release notes for major or sensitive updates.
3. **Test** – For large or runtime-sensitive changes, run locally.
4. **Merge or close** – Close PRs you do not want (e.g. “Closing: non-LTS Node”).

Security updates are created as soon as GitHub detects them, independent of the weekly
schedule.

## Related Documentation

- [GITHUB-LABELS.md](GITHUB-LABELS.md) – Label reference
- [GITHUB-SETUP.md](GITHUB-SETUP.md) – One-time repo configuration
- [GitHub Dependabot docs](https://docs.github.com/en/code-security/dependabot)
