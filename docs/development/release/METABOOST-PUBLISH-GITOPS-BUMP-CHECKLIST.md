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

## 2. GitOps repo — bump images and remote bases

In your **GitOps repository**, under `apps/metaboost-alpha/<component>/`, use **one immutable SemVer-style Git tag** on **`podverse/metaboost`**
(e.g. **`X.Y.Z-staging.N`** from step 1) for **every** remote base URL (`?ref=<that-tag>`) **and** for **every**
`ghcr.io/podverse/metaboost/*` **`newTag`** in those overlays. **Do not** pin remote bases to **`develop`** / **`main`**
for alpha.

**Prerequisite:** The chosen tag must exist on **`podverse/metaboost`** and **GHCR images** must be published for that
release before CI and clusters can render overlays.

**Edit pins** at the GitOps repository root: in each `apps/metaboost-alpha/*/kustomization.yaml`, set every
`https://github.com/podverse/metaboost//infra/k8s/base/...?ref=` to **`?ref=<VERSION_TAG>`** and every
**`ghcr.io/podverse/metaboost/*`** **`newTag`** to the same **`VERSION_TAG`** (including **web-sidecar** and
**management-web-sidecar**). Do **not** change third-party image pins (e.g. Postgres **`newTag`** under **db**).

Then validate from the GitOps repository root using whatever pin contract checks you maintain (for example `kubectl kustomize` on each overlay, or a script such as `scripts/check_metaboost_alpha_version_contract.sh` if your repo ships one).

**Web** and **management-web** overlays use **two** `configMapGenerator` merges each (**`*-config`** + **`*-runtime-config`**); see your GitOps repo’s documentation for **metaboost-alpha** layout when applicable.

**Argo CD `targetRevision`:** Track your GitOps default branch (e.g. **`main`**); environment slices are **folders**
(`apps/metaboost-alpha`, …), not separate GitOps branches. Pins live only in overlay **`?ref=`** / **`newTag`**.

## 3. Optional — env/manifests update in GitOps

If env defaults or overlay values changed for this release, update those files directly in your
GitOps repository, run your GitOps-side validation (for example `kubectl kustomize` checks),
encrypt/update secrets with SOPS as needed, then commit and push. Skip if this release is images
only with no env/manifests changes. See [REMOTE-K8S-GITOPS.md](../k8s/REMOTE-K8S-GITOPS.md).

## 4. Push and sync

**Dry-run `git push`** first when practical, then push the GitOps branch Argo CD tracks; use **dry-run
Argo sync** when your CLI supports it, then sync Applications in dependency order (common → db/keyvaldb →
apis → webs). See [REMOTE-K8S-GITOPS.md](../k8s/REMOTE-K8S-GITOPS.md) Step 11 and **Dry runs first**.
