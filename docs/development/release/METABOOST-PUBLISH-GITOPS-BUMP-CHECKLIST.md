# Checklist: GitOps pins after Metaboost publish (staging branch)

Use this after **Publish (staging)** succeeds on the Metaboost repo. The app repository promotion train is
**`develop` → `staging` → `main`** (use `sync-develop-to-staging.sh`, then after RTM `sync-staging-to-main.sh`;
see [PUBLISH.md](../../PUBLISH.md), [STAGING-MAIN-PROMOTION.md](STAGING-MAIN-PROMOTION.md)). Full remote flow:
[REMOTE-K8S-GITOPS.md](../k8s/REMOTE-K8S-GITOPS.md).

## Glossary (one minute)

- **`-staging.N`** and **`:staging`** are **SemVer prerelease / registry tag names** for images built from
  the **`staging`** Git branch. They are **not** Kubernetes environment names.
- **Cluster environments** are whatever you name GitOps paths and namespaces (e.g. **alpha**,
  **prod** — such as `apps/metaboost-alpha`, `metaboost-alpha`). You do **not** need an environment
  literally named “staging.”

## 1. Read the immutable tag

From GitHub Actions (job output) or GHCR, copy the exact version string for this publish: for the **staging** build line it is **`X.Y.Z-staging.N`**, and after a **main** promote it is **`X.Y.Z`**. That value is also the **Git tag** on the Metaboost workflow commit when applicable. Do
not use bare `X.Y.Z` for preprod unless you are pinning **main** (RTM) or you intentionally overrode the workflow.

## 2. GitOps repo — bump images and (recommended) remote bases

**Prerequisites (local or CI):** standalone **[`kustomize` CLI](https://kubectl.docs.kubernetes.io/installation/kustomize/)**
on **`PATH`** (the bump script uses **`kustomize edit`**), plus **Ruby** (stdlib **YAML**). Optional: **`KUSTOMIZE_BIN`**
to point at a non-default binary. The GitHub Actions workflow **Bump metaboost alpha pins** installs **kustomize**
before running the script.

**k.podcastdj.com:** run **`./scripts/bump-metaboost-alpha-pins.sh <VERSION_TAG> --dry-run`** first, then
**`--push`** (same string as step 1 / Actions **VERSION** output); see
[k.podcastdj.com `docs/METABOOST-GITOPS-PINS.md`](https://github.com/podverse/k.podcastdj.com/blob/main/docs/METABOOST-GITOPS-PINS.md).
That sets every **`newTag`** and **`?ref=`** on podverse/metaboost bases under **`apps/metaboost-alpha/`**
(including **db** and **keyvaldb**).

Alternatively, edit manually in your **GitOps** repository (example paths for **alpha**):

| File                                                     | Update                                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `apps/metaboost-alpha/api/kustomization.yaml`            | Every `images[].newTag` for app images; optionally `resources` URL `?ref=` for the remote base |
| `apps/metaboost-alpha/management-api/kustomization.yaml` | Same                                                                                           |
| `apps/metaboost-alpha/web/kustomization.yaml`            | **web** and **web-sidecar** `newTag` (and optional `?ref=`)                                    |
| `apps/metaboost-alpha/management-web/kustomization.yaml` | **management-web** and **management-web-sidecar** `newTag` (and optional `?ref=`)              |

**Recommended:** Set each remote Metaboost base URL from `?ref=develop` (or a branch) to **`?ref=<that-tag>`**
(or the publish commit SHA) so `infra/k8s/base` matches the built images.

**Manual path:** For an image-only rollout you may leave **db** / **keyvaldb** / **common** kustomizations
unchanged if their remote bases already use an immutable tag; the scripted bump updates **db** and
**keyvaldb** **`?ref=`** for consistency.

**Argo CD `Application` `targetRevision` (k.podcastdj.com):** Applications use **`targetRevision: main`**
(or your GitOps repo default branch). **Preprod and prod** environments are **folders** (`apps/metaboost-alpha`, …),
not separate Git branches on the GitOps repo. Image pins still live in overlay **`newTag`** / **`?ref=`** as
above. See [k.podcastdj.com `docs/GITOPS-ENVIRONMENTS.md`](https://github.com/podverse/k.podcastdj.com/blob/main/docs/GITOPS-ENVIRONMENTS.md).

## 3. Optional — env render from Metaboost

If **`infra/env/classification/`** or **`dev/env-overrides/alpha/`** changed for this release, from
Metaboost root run **`make alpha_env_render_dry_run`** first, then **`make alpha_env_validate`** then
**`make alpha_env_render`** with **`METABOOST_K8S_OUTPUT_REPO`** set to your GitOps clone. SOPS-encrypt
secrets, commit, push. Skip if this release is images only with no env changes. See **Dry runs first** in
[REMOTE-K8S-GITOPS.md](../k8s/REMOTE-K8S-GITOPS.md).

## 4. Push and sync

**Dry-run `git push`** first when practical, then push the GitOps branch Argo CD tracks; use **dry-run
Argo sync** when your CLI supports it, then sync Applications in dependency order (common → db/keyvaldb →
apis → webs). See [REMOTE-K8S-GITOPS.md](../k8s/REMOTE-K8S-GITOPS.md) Step 11 and **Dry runs first**.
