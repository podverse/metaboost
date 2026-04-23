# Publish images (staging, main)

Two workflows cover release artifacts:

1. [`.github/workflows/publish-staging.yml`](../.github/workflows/publish-staging.yml) (display name **“Publish (staging)”**) — runs on every push to **`staging`** (or `workflow_dispatch`).
2. [`.github/workflows/publish-main.yml`](../.github/workflows/publish-main.yml) (display name **“Publish (main)”**) — runs on every push to **`main`**. It does **not** rebuild app images; it **promotes** existing `X.Y.Z-staging.N` images in GHCR to immutable **`X.Y.Z`** and floating **`:prod`**, then creates the **Git tag** and a **non-prerelease** GitHub Release.

| Git branch | What happens         | Immutable image / Git tag pattern       | Floating GHCR tag |
| ---------- | -------------------- | --------------------------------------- | ----------------- |
| `staging`  | Full build + push    | `X.Y.Z-staging.N` (N via Git ref API)   | `staging`         |
| `main`     | Promote (crane copy) | `X.Y.Z` (from root `package.json` base) | `prod`            |

**Changelog (staging only):** The **staging** workflow reads [`docs/operations/CHANGELOG-UPCOMING.md`](operations/CHANGELOG-UPCOMING.md) on the build commit, creates a **prerelease** GitHub Release, and opens a **PR to `develop`** to append [`CHANGELOG-ARCHIVE/`](operations/CHANGELOG-ARCHIVE/DOCS-OPERATIONS-CHANGELOG-ARCHIVE.md) and clear the `UPCOMING` auto block. See the [release-changelog skill](../.cursor/skills/release-changelog/SKILL.md). The **main** workflow uses `CHANGELOG-UPCOMING` on the promote commit for the RTM release body when present.

**Promotion:** all product changes land on **`develop`**. **Promotion branches** (mirrors) are: **`sync-develop-to-staging.sh`**, **`sync-develop-to-main.sh`**. There is no **`beta`** publish line.

---

## Staging: `X.Y.Z-staging.N` (detail)

Pre-release image tags use **`X.Y.Z-staging.N`** and a floating **`:staging`** so clusters can pin the same stream from different GitOps commits. The **`staging` Git branch** is the trigger; cluster folder names (e.g. `metaboost-alpha`) in GitOps stay independent of that name.

## Naming (Git branch, semver, GitOps)

| Name                                   | Meaning                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Git branch **`staging`**               | Triggers the build-and-push publish workflow; fast-forwarded from **`develop`** when you want a build. |
| **`X.Y.Z-staging.N`** / **`:staging`** | **Image** tags (SemVer prerelease + floating tag). Not a cluster or namespace name.                    |
| GitOps **`metaboost-alpha`** (example) | **Environment** folder/namespace. Independent of the word “staging” in image tags.                     |

## What the staging branch is for

The **`staging`** branch is the preprod build line. Default development branch remains **`develop`**. When you fast-forward `staging` from `develop` (or run **Publish (staging)** via **Run workflow** on a chosen ref), the GitHub Action validates, reserves `X.Y.Z-staging.N`, builds images, pushes to GHCR, verifies tags, creates a matching **Git tag**, and creates/updates a **prerelease GitHub Release** (see [CHANGELOG-UPCOMING](operations/CHANGELOG-UPCOMING.md)).

No Kubernetes manifests are applied from this repo to remote clusters. Clusters consume image pins from your **GitOps** repository (e.g. Argo CD `Application` `targetRevision`, Kustomize `newTag`).

Step-by-step GitOps file list: [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](development/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md).

## How to publish

1. **Sync `develop` to a promotion branch** (mirrors, fast-forward only from `develop`):
   - `./scripts/publish/sync-develop-to-staging.sh`
   - `./scripts/publish/sync-develop-to-main.sh`

   If your branch protection does not allow a direct push, use a PR from `develop` to that branch.

2. **Build workflow:** [`.github/workflows/publish-staging.yml`](../.github/workflows/publish-staging.yml) runs on push to **`staging`**, or use **Run workflow** on a chosen ref.

3. **Manual run (staging)** — GitHub: Actions → **Publish (staging)** → **Run workflow**. You can set **version_override** (e.g. `0.1.2-staging.99`) to skip the default atomic auto-increment and reserve a specific tag on the staging line.

4. **RTM (main)** — [`.github/workflows/publish-main.yml`](../.github/workflows/publish-main.yml) on push to **`main`**; no Docker build in that run.

When bumping version via `scripts/publish/bump-version.sh`, the script regenerates the lockfile
under Linux (Docker) before committing so CI gets the correct optional deps. If you add or change
dependencies by hand, run `./scripts/development/update-lockfile-linux.sh` and commit the updated
`package-lock.json`. See [Lockfile (Linux)](development/LOCKFILE-LINUX.md).

## What gets published (staging)

Six images are built from the Dockerfiles under `infra/docker/local/`:

- **api** – Metaboost API
- **management-api** – Metaboost management API
- **web** – Next.js web app
- **web-sidecar** – Runtime-config sidecar for the web app
- **management-web** – Next.js management web app
- **management-web-sidecar** – Runtime-config sidecar for the management web app

Each image is tagged with **`:staging`** and an immutable
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

## Main workflow (promote)

Pushes to **`main`** do not run a Docker build for these six app images. The job selects a single **`X.Y.Z-staging.M`** (minimum across images of each image’s max `N` for the `package.json` base on the commit), **crane**-copies each image to **`X.Y.Z`** and **`:prod`**, then creates Git tag **`X.Y.Z`** and a **non-prerelease** GitHub Release. See [`.github/workflows/publish-main.yml`](../.github/workflows/publish-main.yml).

For `version_override` (staging) and for exact reserved tags, `422 Reference already exists` is accepted only when
the existing tag already points to the workflow commit SHA. If the existing tag points to a
different commit, the workflow fails before `publish-docker` starts.

## How to consume the images

Replace `OWNER` and `REPO` with your GitHub org/user and repo name (e.g. `myorg/metaboost`).

```bash
# Pull by staging tag (latest preprod build from the staging branch pipeline)
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

# After a successful main promote for 0.1.2, you can also pull by RTM or :prod, for example:
# docker pull ghcr.io/OWNER/REPO/api:0.1.2
# docker pull ghcr.io/OWNER/REPO/api:prod
```

For private repos, authenticate to GHCR first (e.g.
`echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin`).

## Workflow reference

- **Staging (build + push):** [`.github/workflows/publish-staging.yml`](../.github/workflows/publish-staging.yml) — runs
  on push to `staging` or `workflow_dispatch`. Display name: **Publish (staging)**.
- **Main (promote + RTM):** [`.github/workflows/publish-main.yml`](../.github/workflows/publish-main.yml).

## Secrets and permissions

The workflows support two tokens for GHCR tag discovery:

- `GHCR_REGISTRY_TOKEN` (recommended): repository secret with `packages:read`
- `GITHUB_TOKEN` (fallback): built-in token if `GHCR_REGISTRY_TOKEN` is not set

If GHCR tag listing fails, the **staging** workflow exits with guidance or use **version override** on manual
dispatch.

Image push uses `GITHUB_TOKEN` with `packages:write` in the publish job.

**Staging** workflow behavior for GHCR tag discovery:

- `200`: normal tag discovery and increment behavior
- `404`: first-run bootstrap, starts at `X.Y.Z-staging.0`
- `401`/`403`: auth or package permission issue (fails with guidance)
- Other status codes: unexpected, fail fast

## Atomic version reservation (staging)

The `reserve-version` job in
[`.github/workflows/publish-staging.yml`](../.github/workflows/publish-staging.yml) is the source of
truth for build versions on the **staging** line.

- It reserves the version by creating a Git tag via `POST /git/refs` at the workflow commit SHA.
- It retries on `422` until an unused `N` is reserved.
- For exact-tag reservations via `version_override`, it accepts `422` only when the tag
  already resolves to the same commit SHA.
- `git ls-remote --tags` is only a smart-start hint to skip obvious gaps quickly.

This plan set is tracked at
[.llm/plans/completed/atomic-publish-version-reservation/00-EXECUTION-ORDER.md](../.llm/plans/completed/atomic-publish-version-reservation/00-EXECUTION-ORDER.md) as historical context.

## Deployment contract

- This pipeline is **publish-first**; it does not apply Kubernetes manifests in-cluster or modify a
  GitOps repo from CI.
- `infra/k8s/alpha/` is scaffold-only; remote overlays live in your GitOps repo.
- Prefer immutable **`X.Y.Z-staging.N`** (and matching **Git tag** on this repo) in overlays;
  **`:staging`** only when you want rolling “latest staging.”
- **Production:** use **`X.Y.Z`** and **`:prod`** after a successful `Publish (main)` run for that version.

## Troubleshooting

- **Tag discovery returns `404`**: Expected on first publish; bootstraps at `X.Y.Z-staging.0`.
- **Tag discovery returns `401` or `403`**: Check `GHCR_REGISTRY_TOKEN` and org package policy.
- **Emergency republish (staging):** Manual dispatch with `version_override`.
