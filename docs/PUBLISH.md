# Alpha branch: publish staging images

This document describes how **staging** Docker images are published from the **`alpha`** branch for
the Metaboost monorepo. Pre-release tags use **`X.Y.Z-staging.N`** and a floating **`:staging`**
tag so the same build can be pinned from multiple non-prod clusters (e.g. alpha and beta) via
GitOps.

## Naming (Git branch, semver, environments)

| Name                                   | Meaning                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Git branch **`alpha`**                 | Triggers the publish workflow; release-candidate line from **`develop`**.                                 |
| **`X.Y.Z-staging.N`** / **`:staging`** | **Image** tags (SemVer prerelease + floating tag). Not a cluster or namespace name.                       |
| GitOps **`metaboost-alpha`** (example) | **Environment** folder/namespace (alpha, beta, prod, …). Independent of the word “staging” in image tags. |

Same **`X.Y.Z-staging.N`** stream can pin **alpha** and **beta** overlays with different GitOps commits.

## What the alpha branch is for

The **`alpha`** branch is the release-candidate line. Default branch remains **`develop`**.
When you merge from `develop` into `alpha` (or push directly to `alpha`), the **Publish staging
(alpha branch)** GitHub Action runs: it validates the repo (audit, build, lint, type-check), builds
and pushes Docker images to GitHub Container Registry (GHCR), verifies tags, and creates a matching
**Git tag** on the workflow commit.

No Kubernetes manifests are applied from this repo. Clusters consume images and overlays from your
**GitOps** repository (e.g. Argo CD `Application` `targetRevision`, Kustomize `newTag`). After each
publish, update those pins in the GitOps repo (PR, automation in that repo, or manual commit)—this
Metaboost workflow does not push to other repositories.

Step-by-step GitOps file list: [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](development/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md).

## How to publish

1. **Sync develop to alpha** – Keep `alpha` as a mirror of `develop`:

   ```bash
   ./scripts/publish/sync-develop-to-alpha.sh
   ```

   If your branch protection does not allow direct push to `alpha`, open a PR from `develop` to
   `alpha` instead.

2. **Merge to alpha** – Open a PR from `develop` into `alpha` (or push to `alpha`). The workflow
   [.github/workflows/publish-alpha.yml](../.github/workflows/publish-alpha.yml) runs on push to
   `alpha`.
3. **Manual run** – In GitHub: Actions → **Publish staging (alpha branch)** → **Run workflow**.
   Choose the `alpha` branch. You can set **Version override** (e.g. `0.1.2-staging.99`); when set,
   that value is used and GHCR auto-increment is skipped.

When bumping version via `scripts/publish/bump-version.sh`, the script regenerates the lockfile
under Linux (Docker) before committing so CI gets the correct optional deps. If you add or change
dependencies by hand, run `./scripts/development/update-lockfile-linux.sh` and commit the updated
`package-lock.json`. See [Lockfile (Linux)](development/LOCKFILE-LINUX.md).

## What gets published

Six images are built from the Dockerfiles under `infra/docker/local/`:

- **api** – Metaboost API
- **management-api** – Metaboost management API
- **web** – Next.js web app
- **web-sidecar** – Runtime-config sidecar for the web app
- **management-web** – Next.js management web app
- **management-web-sidecar** – Runtime-config sidecar for the management web app

Each image is tagged with **`:staging`** (latest staging build from this pipeline) and an immutable
**version tag** `X.Y.Z-staging.N` derived from root `package.json` base version (prerelease stripped)
plus an auto-incremented **N** from existing GHCR tags for that base. Pin clusters with the version
tag; use **`:staging`** only when you intentionally want “latest staging.”

On first publish where GHCR has no package yet, tag discovery `404` bootstraps at **`X.Y.Z-staging.0`**.

### Migration from `-alpha.N` / `:alpha`

Older GHCR tags `*-alpha.*` and `:alpha` are **not** renamed. After this naming change, new tags use
`-staging.N` and `:staging` for the same branch trigger. Historical alpha tags remain in the registry.

## How to consume the images

Replace `OWNER` and `REPO` with your GitHub org/user and repo name (e.g. `myorg/metaboost`).

```bash
# Pull by staging tag (latest staging build from alpha branch pipeline)
docker pull ghcr.io/OWNER/REPO/api:staging
docker pull ghcr.io/OWNER/REPO/management-api:staging
docker pull ghcr.io/OWNER/REPO/web:staging
docker pull ghcr.io/OWNER/REPO/web-sidecar:staging
docker pull ghcr.io/OWNER/REPO/management-web:staging
docker pull ghcr.io/OWNER/REPO/management-web-sidecar:staging

# Or by version tag (immutable)
docker pull ghcr.io/OWNER/REPO/api:0.1.2-staging.2
docker pull ghcr.io/OWNER/REPO/management-api:0.1.2-staging.2
docker pull ghcr.io/OWNER/REPO/web:0.1.2-staging.2
docker pull ghcr.io/OWNER/REPO/web-sidecar:0.1.2-staging.2
docker pull ghcr.io/OWNER/REPO/management-web:0.1.2-staging.2
docker pull ghcr.io/OWNER/REPO/management-web-sidecar:0.1.2-staging.2
```

For private repos, authenticate to GHCR first (e.g.
`echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin`).

## Workflow reference

- **Workflow:** [.github/workflows/publish-alpha.yml](../.github/workflows/publish-alpha.yml) — runs
  on push to `alpha` or `workflow_dispatch`. Display name: **Publish staging (alpha branch)**.

## Secrets and permissions

The workflow supports two tokens for GHCR tag discovery:

- `GHCR_REGISTRY_TOKEN` (recommended): repository secret with `packages:read`
- `GITHUB_TOKEN` (fallback): built-in token if `GHCR_REGISTRY_TOKEN` is not set

If GHCR tag listing fails, the workflow exits with guidance or use **Version override** on manual
dispatch.

Image push uses `GITHUB_TOKEN` with `packages:write` in the publish job.

The workflow behavior for GHCR tag discovery is:

- `200`: normal tag discovery and increment behavior
- `404`: first-run bootstrap, starts at `X.Y.Z-staging.0`
- `401`/`403`: auth or package permission issue (fails with guidance)
- Other status codes: unexpected, fail fast

## Deployment contract

- This pipeline is **publish-first**; it does not apply Kubernetes manifests in-cluster or modify a
  GitOps repo.
- `infra/k8s/alpha/` is scaffold-only; remote overlays live in your GitOps repo.
- Prefer immutable **`X.Y.Z-staging.N`** (and matching **Git tag** on this repo) in overlays;
  **`:staging`** only when you want rolling “latest staging.”

## Troubleshooting

- **Tag discovery returns `404`**: Expected on first publish; bootstraps at `X.Y.Z-staging.0`.
- **Tag discovery returns `401` or `403`**: Check `GHCR_REGISTRY_TOKEN` and org package policy.
- **Emergency republish**: Manual dispatch with `version_override`.
