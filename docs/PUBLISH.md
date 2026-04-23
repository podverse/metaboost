# Publish images (alpha, beta, main)

The workflow [`.github/workflows/publish-alpha.yml`](../.github/workflows/publish-alpha.yml) (display name **“Publish (alpha, beta, main)”**) runs on every push to **`alpha`**, **`beta`**, or **`main`**.

| Git branch | Immutable image / Git tag pattern                     | Floating GHCR tag |
| ---------- | ----------------------------------------------------- | ----------------- |
| `alpha`    | `X.Y.Z-staging.N` (N reserved atomically via Git tag) | `staging`         |
| `beta`     | `X.Y.Z-beta.N`                                        | `beta`            |
| `main`     | `X.Y.Z` (from root `package.json` base)               | `prod`            |

**Changelog / releases:** The workflow reads [`docs/operations/CHANGELOG-UPCOMING.md`](operations/CHANGELOG-UPCOMING.md) on the build commit for the **GitHub Release** body, creates a **Git tag** equal to the published version, and opens a **PR to `develop`** to append [`CHANGELOG-ARCHIVE/`](operations/CHANGELOG-ARCHIVE/DOCS-OPERATIONS-CHANGELOG-ARCHIVE.md) and clear the `UPCOMING` auto block. See the [release-changelog skill](../.cursor/skills/release-changelog/SKILL.md). Promotion scripts: `sync-develop-to-alpha.sh`, `sync-develop-to-beta.sh`, `sync-develop-to-main.sh` (see below).

**Promotion:** all product changes land on **`develop`**; promotion branches are **triggers only** (fast-forward mirrors from `develop`).

---

## Alpha branch: `staging` prerelease (detail)

The following describes how **staging** Docker images are published from the **`alpha`** branch.
Pre-release tags use **`X.Y.Z-staging.N`** and a floating **`:staging`**
tag so the same build can be pinned from multiple non-prod clusters (e.g. alpha and beta) via
GitOps. **Beta** uses a separate `X.Y.Z-beta.N` line; **main** is RTM `X.Y.Z` and `:prod` (table above).

## Naming (Git branch, semver, environments)

| Name                                   | Meaning                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Git branch **`alpha`**                 | Triggers the publish workflow; release-candidate line from **`develop`**.                                 |
| **`X.Y.Z-staging.N`** / **`:staging`** | **Image** tags (SemVer prerelease + floating tag). Not a cluster or namespace name.                       |
| GitOps **`metaboost-alpha`** (example) | **Environment** folder/namespace (alpha, beta, prod, …). Independent of the word “staging” in image tags. |

Same **`X.Y.Z-staging.N`** stream can pin **alpha** and **beta** overlays with different GitOps commits.

## What the alpha branch is for

The **`alpha`** branch is the release-candidate line. Default branch remains **`develop`**.
When you merge from `develop` into `alpha` (or `beta` / `main`, or push those branches), the publish **GitHub Action** runs: it validates the repo (audit, build, lint, type-check, web env merge for the web app), builds
and pushes Docker images to GitHub Container Registry (GHCR), verifies tags, creates a matching
**Git tag** on the workflow commit, and creates/updates a **GitHub Release** (see [CHANGELOG-UPCOMING](operations/CHANGELOG-UPCOMING.md)).

No Kubernetes manifests are applied from this repo. Clusters consume images and overlays from your
**GitOps** repository (e.g. Argo CD `Application` `targetRevision`, Kustomize `newTag`). After each
publish, update those pins in the GitOps repo (PR, automation in that repo, or manual commit)—this
Metaboost workflow does not push to other repositories.

Step-by-step GitOps file list: [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](development/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md).

## How to publish

1. **Sync `develop` to a promotion branch** (mirrors, fast-forward only from `develop`):
   - `./scripts/publish/sync-develop-to-alpha.sh`
   - `./scripts/publish/sync-develop-to-beta.sh`
   - `./scripts/publish/sync-develop-to-main.sh`

   If your branch protection does not allow a direct push, use a PR from `develop` to that branch.

2. **The workflow** [.github/workflows/publish-alpha.yml](../.github/workflows/publish-alpha.yml) runs on push to **`alpha`**, **`beta`**, or **`main`** (or via **Run workflow** on a chosen ref).

3. **Manual run** – GitHub: Actions → **Publish (alpha, beta, main)** → **Run workflow**. You can set **version override** (e.g. `0.1.2-staging.99` for alpha) to skip the atomic auto-increment and reserve a specific tag.

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
**version tag** `X.Y.Z-staging.N`. The base `X.Y.Z` comes from root `package.json` (prerelease
stripped). `N` is selected by the workflow's `reserve-version` job, which atomically creates
`refs/tags/X.Y.Z-staging.N` at the workflow commit via the GitHub Git Refs API and increments `N`
on `422 Reference already exists`. Existing Git tags are inspected only as a starting hint to skip
empty `N` values; correctness comes from the atomic create itself.

GHCR is the storage and verification layer for image tags; it is not used to pick the next `N`.
Pin clusters with the version tag; use **`:staging`** only when you intentionally want
"latest staging."

On first publish where GHCR has no package yet, tag discovery `404` bootstraps at **`X.Y.Z-staging.0`**.

The pipeline publishes **`-staging.N`** and **`:staging`** as described above. GHCR may also list other tags (e.g. from earlier workflows); use the immutable **version tag** when you need a reproducible pin.

For `version_override` (and `main` RTM tags), `422 Reference already exists` is accepted only when
the existing tag already points to the workflow commit SHA. If the existing tag points to a
different commit, the workflow fails before `publish-docker` starts.

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
  on push to `alpha`, `beta`, `main`, or `workflow_dispatch`. Display name: **Publish (alpha, beta, main)**.

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

## Atomic version reservation

The `reserve-version` job in
[.github/workflows/publish-alpha.yml](../.github/workflows/publish-alpha.yml) is the source of
truth for publish versions.

- It reserves the version by creating a Git tag via `POST /git/refs` at the workflow commit SHA.
- For `alpha`/`beta`, it retries on `422` until an unused `N` is reserved.
- For exact-tag reservations (`version_override` and `main`), it accepts `422` only when the tag
  already resolves to the same commit SHA.
- `git ls-remote --tags` is only a smart-start hint to skip obvious gaps quickly.

This plan set is tracked at
[.llm/plans/active/atomic-publish-version-reservation/00-EXECUTION-ORDER.md](../.llm/plans/active/atomic-publish-version-reservation/00-EXECUTION-ORDER.md)
while active, then moved to `.llm/plans/completed/` after completion.

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
