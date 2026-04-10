# Checklist: GitOps pins after Boilerplate publish (alpha branch)

Use this after **Publish staging (alpha branch)** succeeds on the Boilerplate repo. Full remote flow:
[REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md).

## Glossary (one minute)

- **`-staging.N`** and **`:staging`** are **SemVer prerelease / registry tag names** for images built from
  the **`alpha`** Git branch. They are **not** Kubernetes environment names.
- **Cluster environments** are whatever you name GitOps paths and namespaces (e.g. **alpha**, **beta**,
  **prod** — such as `apps/boilerplate-alpha`, `boilerplate-alpha`). You do **not** need an environment
  literally named “staging.”

## 1. Read the immutable tag

From GitHub Actions (job output) or GHCR, copy the exact **`X.Y.Z-staging.N`** string for this publish
(e.g. `0.1.4-staging.0`). That value is also the **Git tag** on the Boilerplate workflow commit. Do
not use bare `X.Y.Z` unless you intentionally override the workflow.

## 2. GitOps repo — bump images and (recommended) remote bases

**Prerequisites (local or CI):** standalone **[`kustomize` CLI](https://kubectl.docs.kubernetes.io/installation/kustomize/)**
on **`PATH`** (the bump script uses **`kustomize edit`**), plus **Ruby** (stdlib **YAML**). Optional: **`KUSTOMIZE_BIN`**
to point at a non-default binary. The GitHub Actions workflow **Bump boilerplate alpha pins** installs **kustomize**
before running the script.

**k.podcastdj.com:** run **`./scripts/bump-boilerplate-alpha-pins.sh <VERSION_TAG> --dry-run`** first, then
**`--push`** (same string as step 1 / Actions **VERSION** output); see
[k.podcastdj.com `docs/BOILERPLATE-GITOPS-PINS.md`](https://github.com/podverse/k.podcastdj.com/blob/main/docs/BOILERPLATE-GITOPS-PINS.md).
That sets every **`newTag`** and **`?ref=`** on podverse/boilerplate bases under **`apps/boilerplate-alpha/`**
(including **db** and **keyvaldb**).

Alternatively, edit manually in your **GitOps** repository (example paths for **alpha**):

| File                                                       | Update                                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `apps/boilerplate-alpha/api/kustomization.yaml`            | Every `images[].newTag` for app images; optionally `resources` URL `?ref=` for the remote base |
| `apps/boilerplate-alpha/management-api/kustomization.yaml` | Same                                                                                           |
| `apps/boilerplate-alpha/web/kustomization.yaml`            | **web** and **web-sidecar** `newTag` (and optional `?ref=`)                                    |
| `apps/boilerplate-alpha/management-web/kustomization.yaml` | **management-web** and **management-web-sidecar** `newTag` (and optional `?ref=`)              |

**Recommended:** Set each remote Boilerplate base URL from `?ref=develop` (or a branch) to **`?ref=<that-tag>`**
(or the publish commit SHA) so `infra/k8s/base` matches the built images.

**Manual path:** For an image-only rollout you may leave **db** / **keyvaldb** / **common** kustomizations
unchanged if their remote bases already use an immutable tag; the scripted bump updates **db** and
**keyvaldb** **`?ref=`** for consistency.

**Argo CD `Application` `targetRevision` (k.podcastdj.com):** Applications use **`targetRevision: main`**
(or your GitOps repo default branch). **Alpha / beta / prod** are **folders** (`apps/boilerplate-alpha`, …),
not separate Git branches on the GitOps repo. Image pins still live in overlay **`newTag`** / **`?ref=`** as
above. See [k.podcastdj.com `docs/GITOPS-ENVIRONMENTS.md`](https://github.com/podverse/k.podcastdj.com/blob/main/docs/GITOPS-ENVIRONMENTS.md).

## 3. Optional — env render from Boilerplate

If **`infra/env/classification/`** or **`dev/env-overrides/alpha/`** changed for this release, from
Boilerplate root run **`make alpha_env_render_dry_run`** first, then **`make alpha_env_validate`** then
**`make alpha_env_render`** with **`BOILERPLATE_K8S_OUTPUT_REPO`** set to your GitOps clone. SOPS-encrypt
secrets, commit, push. Skip if this release is images only with no env changes. See **Dry runs first** in
[REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md).

## 4. Push and sync

**Dry-run `git push`** first when practical, then push the GitOps branch Argo CD tracks; use **dry-run
Argo sync** when your CLI supports it, then sync Applications in dependency order (common → db/keyvaldb →
apis → webs). See [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) Step 11 and **Dry runs first**.
