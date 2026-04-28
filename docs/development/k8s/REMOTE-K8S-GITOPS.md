# Remote Kubernetes (GitOps)

**Start here** for deploying Metaboost to a **remote** cluster with GitOps and Argo CD (thin overlays, env render, SOPS). For local k3d, see [K3D-ARGOCD-LOCAL.md](K3D-ARGOCD-LOCAL.md).

End-to-end steps from a **clean slate** to a working Metaboost stack on **your** cluster and **your** domains, using a **separate GitOps repository** for Kustomize overlays, Argo CD `Application` resources, and (after env render) generated **`source/metaboost-*-config.env`** files (consumed by overlay **`configMapGenerator`** **`envs:`** → ConfigMaps) and Secret patches.

This repository holds application source, [`infra/env/classification`](../../../infra/env/classification/), and `make alpha_env_render`. The GitOps repo is yours: layout, namespace names, and hostnames are conventions you choose and keep consistent with Argo CD and ingress.

**Wipe Postgres data and re-align Secrets with a fresh volume:** [REMOTE-K8S-POSTGRES-REINIT.md](REMOTE-K8S-POSTGRES-REINIT.md).

## Dry runs first (recommended)

Where a **dry run** exists for **kubectl**, **Argo CD**, **env render**, or **GitOps helper scripts** (pin bump, align sources), use it **before** the real command so you catch mistakes without changing cluster state, publishing to the registry prematurely, or writing overlay files until you mean to.

| When                                                      | Dry run (use this first)                                                                                              | Then                                                                                  |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Pin images + Metaboost `?ref=`** (e.g. k.podcastdj.com) | `./scripts/bump-metaboost-alpha-pins.sh <VERSION_TAG> --dry-run`                                                      | `./scripts/bump-metaboost-alpha-pins.sh <VERSION_TAG> --push` or manual edit + commit |
| **Env render** (Metaboost root)                           | `make alpha_env_render_dry_run` (optional: set `METABOOST_K8S_OUTPUT_REPO` to match validate/render)                  | `make alpha_env_validate` then `make alpha_env_render`                                |
| **Apply Argo `Application` / `AppProject` YAML**          | `kubectl apply --dry-run=server -f …` (or `=client` if server dry-run is unavailable)                                 | `kubectl apply -f …`                                                                  |
| **Apply decrypted Secret YAML**                           | `sops -d secrets/… \| kubectl apply --dry-run=server -n <namespace> -f -`                                             | `sops -d … \| kubectl apply -n <namespace> -f -`                                      |
| **Compile overlays locally**                              | `kubectl kustomize apps/metaboost-<env>/api --load-restrictor LoadRestrictionsNone >/dev/null` (repeat per component) | Push GitOps and sync Argo                                                             |
| **Argo CD sync** (CLI)                                    | `argocd app sync <app> --dry-run` when your Argo CD version supports it                                               | Normal sync (UI or CLI)                                                               |

### Argo CD CLI login (HTTPS-only ingress)

When Argo CD is exposed **only on HTTPS** (typical behind Traefik or similar), use
`argocd login <host> --grpc-web` with **TLS** (default for a bare hostname). Do **not** use
`--plaintext`; that forces HTTP and often yields **404** on paths like
`session.SessionService/Create` or `application.ApplicationService/Get`. If the certificate is not
trusted locally, use `--insecure` only for testing, or install your CA.

**Git push (GitOps `main`):** After **`git status`** / **`git diff`** look right, push with **`git push origin main`**. No separate Git dry-run step is documented here.

**Metaboost remote bases:** Pin **`?ref=`** to an **immutable tag** (e.g. **`X.Y.Z-staging.N`** from publish), not a branch name, for production-style alpha overlays—see [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](../release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md).

## Terminology (examples)

Throughout this doc, replace placeholders with your own names:

| Placeholder                   | Meaning                                                                                                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GitOps repo**               | Repository Argo CD syncs (clone URL you control).                                                                                                                                                                                |
| **`apps/metaboost-<env>/`**   | Per-component overlays (e.g. `alpha`, `beta`, `prod`). Render output paths use the same `<env>` as `dev/env-overrides/<env>/` in this repo. The SemVer segment **`-staging.N`** on **images** is not a cluster environment name. |
| **`argocd/metaboost-<env>/`** | Argo `Application` manifests for that environment.                                                                                                                                                                               |
| **`<namespace>`**             | Kubernetes namespace for workloads (often matches env, e.g. `metaboost-alpha`).                                                                                                                                                  |
| **Public URLs**               | e.g. `https://app.example.com`, `https://api.example.com`, `https://management.example.com` — must match ingress, TLS, CORS, and cookie settings in overrides.                                                                   |

## What you are wiring

| Piece                     | Role                                                                                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kubernetes cluster**    | Runs workloads; typically has **Argo CD**, **cert-manager**, and an **ingress controller** (Traefik, nginx, etc.).                                                                                         |
| **GitOps repo**           | Kustomize overlays, Argo `Application` CRs, encrypted registry/pull secrets, and (after render) **`source/metaboost-*-config.env`** + overlay `configMapGenerator` + `deployment-secret-env.yaml` patches. |
| **This (Metaboost) repo** | Source code, env classification, `make alpha_env_*`, image build (CI or local), and `METABOOST_K8S_OUTPUT_REPO` pointing at your GitOps clone.                                                             |
| **Container registry**    | Hosts images (e.g. GitHub Container Registry); cluster needs an image pull secret if the registry is private.                                                                                              |

### GitOps repo vs public domains (Podverse reference)

The **GitOps** repository (**k.podcastdj.com**) holds overlays, ingress, and Argo CD `Application`
CRs. **Browser and API hostnames** for Metaboost alpha are on **metaboost.cc** (same cluster,
different DNS/TLS names). Keep **`alpha_env_render`** overrides, ingress rules, CORS, and cookie
domains consistent with those public hosts. See also [ARGOCD-GITOPS-METABOOST.md](ARGOCD-GITOPS-METABOOST.md).

### Browser: cross-origin requests and untrusted API TLS

After deploy, **web** and **management-web** call **api** and **management-api** on different hostnames (cross-origin). If the browser shows **Cross-Origin Request Blocked** / **CORS request did not succeed** with **no HTTP status**, the failure is often **TLS trust**, not a missing **`API_CORS_ORIGINS`** / **`MANAGEMENT_API_CORS_ORIGINS`** value. That happens when the API hostname uses a certificate the browser does not accept (e.g. Let’s Encrypt **staging**, **self-signed** certs, **corporate TLS inspection**, or other **non-production** chains).

**Workaround for testing:** In the same browser profile, open each public API base URL over HTTPS and proceed past the security warning so those origins are trusted; reload the app. On **Podverse** alpha (metaboost), that typically includes **`https://api.alpha.metaboost.cc`** and **`https://management-api.alpha.metaboost.cc`**. Longer runbook: **`docs/k8s/metaboost/alpha/METABOOST-REDEPLOY-FULL.md`** in your **GitOps** repository (e.g. **k.podcastdj.com**), section **Browser: “CORS” errors and TLS trust (alpha)**.

### Publish order after changing Metaboost bases

When you change manifests under **`infra/k8s/base/`** in this repo, or ship new images:

1. After a successful **Publish staging** run in **this** repository, a **Git tag** **`X.Y.Z-staging.N`**
   exists (same string as GHCR; see [ARGOCD-GITOPS-METABOOST.md](ARGOCD-GITOPS-METABOOST.md)).
2. In your **GitOps** repo, set overlay **`images[].newTag`** and remote Metaboost base **`?ref=`** to
   that **immutable tag** (scripted or manual)—see
   [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](../release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md). **Dry run**
   the pin bump when a script supports it (e.g. **`--dry-run`**) before **`--push`** / commit.
3. **Argo `Application.spec.source.targetRevision`** on the GitOps repo should be **`main`** (not
   Metaboost). **Alpha / beta / prod** are **path prefixes** (`apps/metaboost-alpha`, …), not
   extra long-lived branches on the GitOps repo. **`?ref=`** on Metaboost URLs still uses the
   immutable tag **`X.Y.Z-staging.N`**. Keep **GitOps `targetRevision`** and **Metaboost `?ref=`**
   mentally separate.
4. From **Metaboost** root: **`make alpha_env_render_dry_run`**, then **`make alpha_env_validate`**, then
   **`make alpha_env_render`** when env/classification/overrides changed (port + ingress patches run at the
   end of render). Skip render if this release is images-only with no env changes.
5. **SOPS-encrypt** any new or changed Secret YAML under **`secrets/`** (use **`encrypt_metaboost_plain_secrets.sh`**
   in the GitOps repo for **`plain/metaboost-*-secrets.yaml`** when available), commit **encrypted** files and
   overlay updates in the GitOps repo.
6. **Push** **`main`** on the GitOps repo (matching **`targetRevision`**), then **sync** Applications in
   dependency order (Step 11). Prefer **dry-run sync** when available (see table above).

## Step 1 — Tooling and access

**Do this:** Install **kubectl**, **SOPS**, **age** (encrypt/decrypt), **Docker** (optional local builds),
**Ruby** (stdlib; used by render scripts), **Git**, and **make**. Ensure you can **push** **`main`** on the
GitOps remote Argo CD syncs and **pull** images from your registry (e.g. PAT with `read:packages` for GHCR pull
secrets).

**Kustomize (two roles):**

- **Build / validate overlays:** use **`kubectl kustomize <path>`** (Kustomize is embedded in kubectl). This is enough for compiling GitOps paths locally and matches common Argo CD behavior.
- **Edit `kustomization.yaml` from scripts:** your GitOps repo may ship helpers (e.g. **`bump-metaboost-alpha-pins.sh`**, **`align-metaboost-git-base.sh`** on **k.podcastdj.com**) that run **`kustomize edit`** (`set image`, `add`/`remove resource`). Those require the **standalone [`kustomize` CLI](https://kubectl.docs.kubernetes.io/installation/kustomize/)** on **`PATH`** (or **`KUSTOMIZE_BIN`**). They also use **Ruby** (stdlib **YAML**) to read ordered **`resources:`** before rewriting via **`kustomize edit`**.

**Verify tooling** (from any shell; versions should print and exit 0):

```bash
kubectl version --client=true
sops --version
age --version
age-keygen --version
docker --version
ruby --version
git --version
make --version
kubectl kustomize --help >/dev/null && echo "kubectl kustomize: ok"
command -v kustomize >/dev/null && kustomize version && echo "kustomize CLI: ok" || echo "kustomize CLI: skip (only needed for GitOps pin/align scripts)"
```

**Verify Git remote** on the GitOps clone Argo CD tracks (from that repository):

```bash
git remote -v
git fetch origin
```

When commits are ready, push **`main`** with **`git push origin main`** (see Step 11).

**Verify registry pull** (optional; requires credentials with `read:packages` for GHCR):

```bash
docker login ghcr.io
docker pull <registry>/<image>:<tag>
```

**Why:** Render and validation run from this repo; secrets must be encrypted before commit; Argo CD and kubectl need a working kubeconfig.

---

## Step 2 — Clone both repositories

**Do this:**

```bash
git clone <url-to-your-metaboost-fork-or-upstream>
git clone <url-to-your-gitops-repo>
```

**Why:** Env render writes into the GitOps working tree; you edit overlays and Argo apps alongside the application repo.

---

## Step 3 — Cluster and ingress assumptions

**Do this:** Ensure **Argo CD** is installed (e.g. namespace `argocd`), your **kubeconfig** points at the target
cluster, and **DNS** for your public hostnames resolves to the ingress entrypoint. Align **cert-manager**
ClusterIssuer / ingress annotations in your GitOps **Ingress** resources with your DNS and CA workflow
(HTTP-01, DNS-01, or your provider’s pattern).

**Verify cluster and Argo CD:**

```bash
kubectl config current-context
kubectl cluster-info
kubectl get ns argocd
kubectl get pods -n argocd
```

**Verify DNS** (replace with your real API or app hostname):

```bash
dig +short api.example.com
# or: nslookup api.example.com
```

**Verify cert-manager** (if you use it):

```bash
kubectl get clusterissuer
kubectl -n <namespace> get certificate
```

**Why:** Wrong TLS or ingress class prevents HTTPS and breaks browser API calls until manifests match your platform.

---

## Step 4 — Align Argo CD `Application` sources with your Git remote

### One-time bootstrap (your GitOps remote)

After a **fresh clone or fork** of your GitOps repository, each Argo `Application` under
`argocd/metaboost-<env>/` must use **`spec.source.repoURL`** and **`targetRevision`** for **your**
Git remote URL and **`main`** — not a template or another operator’s fork.

Run all commands from the **root of your GitOps repository** (where `scripts/` and `argocd/` live).
Replace placeholders (`<org>`, `<gitops-repo>`, `<env>`, tags) with your values. More detail lives in
your clone’s **`docs/GITOPS-BOOTSTRAP.md`** and **`docs/METABOOST-GITOPS-PINS.md`** when present.

**1. Preview** Argo `Application` sources (no writes) — one env or all `argocd/metaboost-*/`
directories:

```bash
./scripts/align-argocd-application-sources.sh \
  --repo-url 'https://github.com/<org>/<gitops-repo>.git' \
  --revision main \
  --env <env> \
  --dry-run
```

```bash
./scripts/align-argocd-application-sources.sh \
  --repo-url 'https://github.com/<org>/<gitops-repo>.git' \
  --revision main \
  --all-metaboost \
  --dry-run
```

**2. Apply** when the diff is correct (skip if dry-run showed no diff — already aligned):

```bash
./scripts/align-argocd-application-sources.sh \
  --repo-url 'https://github.com/<org>/<gitops-repo>.git' \
  --revision main \
  --env <env>
```

```bash
./scripts/align-argocd-application-sources.sh \
  --repo-url 'https://github.com/<org>/<gitops-repo>.git' \
  --revision main \
  --all-metaboost
```

**Interactive:** On a TTY you may omit **`--repo-url`** and **`--revision`** (script prompts); you
must still pass **`--env`**, **`--all-metaboost`**, or **`--dir`**. Use **`--interactive`** to
force prompts when stdin is not a TTY. See **`./scripts/align-argocd-application-sources.sh --help`**.

**Manual:** Edit each YAML under `argocd/metaboost-<env>/` and set **`repoURL`** and
**`targetRevision`** explicitly.

**Why:** Argo CD must sync **your** GitOps repo; a stale `repoURL` points at the wrong repository.

### Optional: Metaboost fork (remote base URL only)

If overlays must pull bases from **your** Metaboost fork, rewrite the repo **prefix** on remote
`resources:` URLs (does **not** change **`?ref=`** or image tags).

**1. Preview:**

```bash
./scripts/align-metaboost-git-base.sh \
  --from 'https://github.com/<upstream-org>/metaboost' \
  --to 'https://github.com/<your-org>/metaboost' \
  --env <env> \
  --dry-run
```

**2. Apply** without **`--dry-run`** (skip if you keep upstream Metaboost bases):

```bash
./scripts/align-metaboost-git-base.sh \
  --from 'https://github.com/<upstream-org>/metaboost' \
  --to 'https://github.com/<your-org>/metaboost' \
  --env <env>
```

### Recurring: pin Metaboost bases and images

After **Metaboost** publish, **`?ref=`** on remote bases and **`images[].newTag`** must use the
same immutable tag as Git and GHCR.

**1. Preview:**

```bash
./scripts/bump-metaboost-alpha-pins.sh '<X.Y.Z-staging.N>' --dry-run
```

**2. Apply** (writes files):

```bash
./scripts/bump-metaboost-alpha-pins.sh '<X.Y.Z-staging.N>'
```

Then **`git diff`**, commit, and push. For scripted **topic branch** + push (e.g. PR flow), use
**`--push`** as documented in your GitOps repo’s **`docs/METABOOST-GITOPS-PINS.md`**.

**Fork:** When pins target a Metaboost fork, set **`METABOOST_GIT_BASE`** (no trailing slash) on
the same command line:

```bash
METABOOST_GIT_BASE='https://github.com/<your-org>/metaboost' \
  ./scripts/bump-metaboost-alpha-pins.sh '<X.Y.Z-staging.N>' --dry-run
```

```bash
METABOOST_GIT_BASE='https://github.com/<your-org>/metaboost' \
  ./scripts/bump-metaboost-alpha-pins.sh '<X.Y.Z-staging.N>'
```

Details: your GitOps repo’s **`docs/METABOOST-GITOPS-PINS.md`**.

### Optional: compile overlays locally

```bash
kubectl kustomize apps/metaboost-<env>/api \
  --load-restrictor LoadRestrictionsNone >/dev/null
kubectl kustomize apps/metaboost-<env>/web \
  --load-restrictor LoadRestrictionsNone >/dev/null
kubectl kustomize apps/metaboost-<env>/management-api \
  --load-restrictor LoadRestrictionsNone >/dev/null
kubectl kustomize apps/metaboost-<env>/management-web \
  --load-restrictor LoadRestrictionsNone >/dev/null
kubectl kustomize apps/metaboost-<env>/db \
  --load-restrictor LoadRestrictionsNone >/dev/null
kubectl kustomize apps/metaboost-<env>/keyvaldb \
  --load-restrictor LoadRestrictionsNone >/dev/null
kubectl kustomize apps/metaboost-<env>/common \
  --load-restrictor LoadRestrictionsNone >/dev/null
```

### Kustomize remote bases (thin overlays)

If component overlays in your GitOps repo **pull** shared bases from this repository via
`resources:` (instead of duplicating Deployments), each entry must be a **remote git URL**
Kustomize can clone, not a bare `github.com/org/repo/...` string (that form is treated as a
**relative path** and breaks `kubectl kustomize`).

**Use:**

```text
https://github.com/<org>/metaboost//infra/k8s/base/<component>?ref=<immutable-tag-or-commit>
```

Note the **`//`** after the repository segment: it separates the repo URL from the path **inside**
the repo. Optional query params include `ref` (immutable tag or full commit hash) and `timeout`.

**Pin `ref`:** `kubectl kustomize` and Argo CD only resolve manifests that **exist at that
revision**. For production-style overlays, set **`ref`** to the **immutable publish tag**
**`X.Y.Z-staging.N`** (same as GHCR), not a moving branch name.

---

## Step 5 — Register the Argo CD project and applications

**Do this:** From the **GitOps** repo root, with kubectl context set to the remote cluster, apply your **AppProject** and the **Application** set for Metaboost (paths depend on how you organized the repo). **Dry-run apply first** so the API rejects invalid YAML before anything is stored:

```bash
kubectl apply --dry-run=server -f argocd/apps/<your-project>.yaml
kubectl apply --dry-run=server -f argocd/metaboost-<env>/
kubectl apply -f argocd/apps/<your-project>.yaml
kubectl apply -f argocd/metaboost-<env>/
```

**Why:** Creates the Argo **AppProject** and one **Application** per slice (common, db, keyvaldb, api, management-api, web, management-web, etc.). Document sync order and any team-specific steps in **your GitOps repo** (e.g. `docs/DEPLOYMENT.md`).

---

## Step 6 — Container registry pull secret (`<namespace>`)

**Do this:** Create a **`docker-registry`** Secret in **`<namespace>`** so workloads can pull **private**
images. Many GitOps repos that ship Metaboost overlays include a **GitHub Container Registry (GHCR)**
helper; otherwise create the Secret by hand, encrypt with **SOPS** before commit, and apply decrypted YAML
when bootstrapping.

### GitHub Container Registry (when `create_github_registry_secret.sh` exists)

From **your GitOps repository root**, if **`./scripts/create_github_registry_secret.sh`** is present:

1. Run **`./scripts/create_github_registry_secret.sh`** (it **prompts** for GitHub username, a **Personal
   Access Token**, and namespace — use **`<namespace>`** e.g. **`metaboost-alpha`**). The PAT needs
   **`read:packages`** (and **`write:packages`** only if you push images with that token).
2. The script writes **`secrets/<namespace>/github-registry-secret.enc.yaml`** (SOPS-encrypted
   **`docker-registry`** secret for **`ghcr.io`**, name **`github-registry-secret`**). Commit the **encrypted**
   file only; requires repo **`.sops.yaml`** / age keys like your other secrets.
3. Apply to the cluster:

```bash
sops -d secrets/<namespace>/github-registry-secret.enc.yaml | kubectl apply -f -
```

The manifest includes **`metadata.namespace`**; **`kubectl apply -f -`** targets that namespace.

**`imagePullSecrets`:** Pod templates (or the **`ServiceAccount`** they use) must reference
**`github-registry-secret`** (or whatever name your script uses). Wire this in your GitOps overlays or
patches — see **your GitOps repo** README or deployment docs.

### Other registries or no helper script

Create a **`docker-registry`** Secret manifest without applying cleartext to the cluster, then encrypt and
commit:

```bash
kubectl create secret docker-registry <secret-name> \
  --docker-server=<registry-host> \
  --docker-username=<user> \
  --docker-password=<token> \
  --namespace=<namespace> \
  --dry-run=client -o yaml > temp-secret.yaml
# encrypt temp-secret.yaml with sops to secrets/<namespace>/<file>.enc.yaml, commit, remove temp-secret.yaml
```

Apply when bootstrapping:

```bash
sops -d secrets/<path-to-encrypted-pull-secret>.yaml | kubectl apply -f -
```

**Why:** Without pull credentials, pods remain in **`ImagePullBackOff`**.

---

## Step 7 — Env overrides (`remote_k8s` + GitOps overlay)

**Do this:**

1. **GitOps repo (per environment):** Add or edit **`apps/metaboost-<env>/env/remote-k8s.yaml`** — same YAML shape as the monorepo’s [`infra/env/overrides/remote-k8s.yaml`](../../../infra/env/overrides/remote-k8s.yaml) (`version` + `env_groups`). Put **deployment-specific** defaults here: **`WEB_BASE_URL`**, **`MANAGEMENT_WEB_BASE_URL`**, **`API_PUBLIC_BASE_URL`**, **`MANAGEMENT_API_PUBLIC_BASE_URL`**, **`API_COOKIE_DOMAIN`**, **`API_CORS_ORIGINS`**, **`MANAGEMENT_API_COOKIE_DOMAIN`**, **`MANAGEMENT_API_CORS_ORIGINS`**, etc. Use **`https://`** where ingress serves TLS. Commit this file in the GitOps repo (not under **`secrets/`**).

2. **Metaboost monorepo:** [`infra/env/overrides/remote-k8s.yaml`](../../../infra/env/overrides/remote-k8s.yaml) stays **portable** (in-cluster **`postgres`** / **`valkey`** hostnames, empty URL shells). Forks do not need to fork site-specific hosts.

3. **Optional `.env` layers:** In **Metaboost** repo root, **`make alpha_env_prepare`** / **`make alpha_env_link`** then edit **`~/.config/metaboost/alpha-env-overrides/*.env`** for secrets and any keys you do not want in Git (JWT, DB passwords, Valkey password, mailer, etc.).

**Why:** Classification drives non-secret config (`.env` → ConfigMap) and Secret key sets; public URLs and cookies must match ingress. Keeping site defaults in the GitOps overlay keeps the Metaboost clone generic; `make alpha_env_render` merges the GitOps file automatically when **`METABOOST_K8S_OUTPUT_REPO`** points at that clone (see **[K8S-ENV-RENDER.md](K8S-ENV-RENDER.md)**).

---

## Step 8 — Render config env files and Secret patches into the GitOps repo

**Do this:** From **Metaboost** root, **in order** (dry run before writing files):

```bash
export METABOOST_K8S_OUTPUT_REPO=/absolute/path/to/your/gitops-repo
make alpha_env_render_dry_run   # always first: prints rendered .env + Secret YAML; does not write
make alpha_env_validate         # classification + drift vs committed overlay (needs output repo)
make alpha_env_render           # writes source/metaboost-*-config.env, deployment-secret-env.yaml, port/ingress patches, secrets/.../plain/
```

**Why:** Keeps rendered **`source/metaboost-*-config.env`** (wired via **`configMapGenerator`** in each component **`kustomization.yaml`**) and **`deployment-secret-env.yaml`** in sync with [`infra/env/classification`](../../../infra/env/classification). Full reference: **[K8S-ENV-RENDER.md](K8S-ENV-RENDER.md)**.

---

## Step 9 — Encrypt Secret YAML and commit (never commit cleartext)

**Do this:** After **`make alpha_env_render`** (or **`make k8s_env_render`**) writes cleartext Metaboost workload manifests under **`secrets/<namespace>/plain/`**, encrypt them with **SOPS** using your GitOps repo’s **`.sops.yaml`** / age keys, then commit **only** the **`*.enc.yaml`** files (and updated **`apps/metaboost-<env>/**`**). Do **not** commit the **`plain/`\*\* tree if it is gitignored (or otherwise keep cleartext out of Git).

**Metaboost workload secrets (batch):** From **your GitOps repository root**, if **`./scripts/encrypt_metaboost_plain_secrets.sh`** exists (e.g. **k.podcastdj.com**), run:

```bash
./scripts/encrypt_metaboost_plain_secrets.sh --namespace metaboost-alpha --dry-run   # preview
./scripts/encrypt_metaboost_plain_secrets.sh --namespace metaboost-alpha             # write *.enc.yaml
./scripts/encrypt_metaboost_plain_secrets.sh --namespace metaboost-alpha --rm-plain # encrypt then delete plain/*.yaml
```

That encrypts every **`secrets/<namespace>/plain/metaboost-*-secrets.yaml`** to **`secrets/<namespace>/<same-basename>.enc.yaml`**. **`--rm-plain`** removes those cleartext files after encrypt (optional; next **`make alpha_env_render`** regenerates **`plain/`** anyway). Other secrets (registry PAT, Tailscale, etc.) still use **`sops -e`** or their own helper scripts.

**Why:** The GitOps repo stays safe; the cluster receives cleartext only via `sops -d | kubectl apply`, a secrets operator, or your org’s standard pattern.

Apply encrypted secrets to the cluster (repeat per file as documented in your GitOps repo). **Dry-run
apply first** when you want the API server to validate objects without persisting them:

```bash
sops -d secrets/<path>/metaboost-api-secrets.enc.yaml | kubectl apply --dry-run=server -n <namespace> -f -
sops -d secrets/<path>/metaboost-api-secrets.enc.yaml | kubectl apply -n <namespace> -f -
# ... db, valkey, management-api, web, management-web, sidecars as applicable
```

**Metaboost workload secrets (batch apply):** From **your GitOps repository root**, if **`./scripts/apply_metaboost_encrypted_secrets.sh`** exists, decrypt and apply every **`secrets/<namespace>/metaboost-*-secrets.enc.yaml`** in sorted order (workload secrets only; not registry or other ad-hoc **`*.enc.yaml`**). Rendered manifests set **`metadata.namespace`**; **`kubectl -n`** is optional if you want an extra guardrail.

```bash
./scripts/apply_metaboost_encrypted_secrets.sh --namespace metaboost-alpha --server-dry-run   # k8s API validation only
./scripts/apply_metaboost_encrypted_secrets.sh --namespace metaboost-alpha                 # apply for real
```

**`--print-only`** prints each **`sops -d … | kubectl apply …`** line without running **`sops`**, **`kubectl`**, or touching the cluster.

---

## Step 10 — Build and publish container images

**Do this:** Push images to your registry with tags referenced in GitOps Kustomize **`images[].newTag`** (e.g. per-app `kustomization.yaml`). Typical path: CI runs **Publish staging** and publishes pre-release tags **`X.Y.Z-staging.N`**. Alternatively build and push locally with the same tag scheme.

**Why:** Argo CD syncs Deployments that point at immutable tags; missing tags cause pull failures.

**Image names:** Point **`images[].name`** / **`newName`** in overlays at **your** registry and repository path (forks and orgs differ).

---

## Step 11 — Push GitOps; sync Argo CD in order

**Do this:** Push the branch Argo **`Application.spec.source.targetRevision`** tracks (often **`main`**), then
sync **Applications** in dependency order via the Argo CD CLI (or UI). **CLI:** log in first (HTTPS +
**`--grpc-web`**; see **Argo CD CLI login (HTTPS-only ingress)** above)—do not use **`--plaintext`** if
your ingress is HTTPS-only.

**Git (from your GitOps repo root),** when **`targetRevision`** is **`main`**:

```bash
git push origin main
```

**Argo CD application names** must match **`metadata.name`** on each `Application` CR (below uses the
usual **alpha** names from **`argocd/metaboost-alpha/*.yaml`**; substitute **`beta`**, **`prod`**, or
your prefix if different).

**1) Dry-run sync** (same order; skip if your Argo CD CLI does not support **`app sync --dry-run`**):

```bash
argocd app sync metaboost-alpha-common --dry-run
argocd app sync metaboost-alpha-db --dry-run
argocd app sync metaboost-alpha-keyvaldb --dry-run
argocd app sync metaboost-alpha-api --dry-run
argocd app sync metaboost-alpha-management-api --dry-run
argocd app sync metaboost-alpha-web --dry-run
argocd app sync metaboost-alpha-management-web --dry-run
```

**2) Sync for real** (repeat without **`--dry-run`**):

```bash
argocd app sync metaboost-alpha-common
argocd app sync metaboost-alpha-db
argocd app sync metaboost-alpha-keyvaldb
argocd app sync metaboost-alpha-api
argocd app sync metaboost-alpha-management-api
argocd app sync metaboost-alpha-web
argocd app sync metaboost-alpha-management-web
```

**Order:** **common** (namespace, ingress, TLS hosts) → **db**, **keyvaldb** → **api**,
**management-api** → **web**, **management-web**. If **`syncPolicy.automated`** is enabled, Argo may sync
without these commands; run them when you want an explicit pass or to confirm after a push.

**Why:** Datastores must be ready before APIs; web depends on APIs and runtime config.

### Standard Endpoint (`/v1/standard/*`) HTTPS (app layer)

Terminate TLS at your **Ingress** or cloud load balancer so browsers and apps speak HTTPS to the public hostname. The API Pod usually receives **plain HTTP** on the cluster Service; set **`STANDARD_ENDPOINT_TRUST_PROXY=true`** in the API env (see [ENV-REFERENCE.md](../env/ENV-REFERENCE.md) § `STANDARD_ENDPOINT_REQUIRE_HTTPS` / `STANDARD_ENDPOINT_TRUST_PROXY`) so the app trusts **`X-Forwarded-Proto: https`** from the proxy. **`STANDARD_ENDPOINT_REQUIRE_HTTPS`** is enabled for remote Kubernetes via **`infra/env/overrides/remote-k8s.yaml`** so cleartext requests that bypass TLS are rejected for Standard Endpoint routes. Local Compose and local k3d profiles set both flags to **`false`**.

**Postgres init:** On a **new empty** data volume, Metaboost **`infra/k8s/base/db`** mounts **`docker-entrypoint-initdb.d`** (same assets as **`infra/k8s/base/stack`**) so canonical bootstrap SQL, the management database, ORM roles, and grants run at first start when **`metaboost-db-secrets`** is applied before the pod initializes **`PGDATA`**. Ongoing schema changes should use forward-only linear migrations (`docs/development/DB-MIGRATIONS.md`). Re-seeding, drift, or a workload that does not mount the init ConfigMap require a **PVC wipe and fresh pod** or **manual SQL** — see [REMOTE-K8S-POSTGRES-REINIT.md](REMOTE-K8S-POSTGRES-REINIT.md).

---

## Step 12 — Bootstrap the first management super admin

**Why:** Management web login requires a row in the management DB; schema init does not insert that user.

**Prerequisites:** Postgres has the management database and schema, and migrations have completed. Trigger the suspended CronJob (**`metaboost-management-superuser-create`** or **`metaboost-management-superuser-update`**) after migration jobs succeed.

### Option A — In-cluster Job (preferred; no local `.env`)

Use the suspended ops CronJobs and trigger one-off Jobs from them:

- `metaboost-management-superuser-create`
- `metaboost-management-superuser-update`

```bash
K8S_NAMESPACE=<namespace> npm run management:superuser:create:k8s
# or
K8S_NAMESPACE=<namespace> npm run management:superuser:update:k8s
```

Then follow logs:

```bash
kubectl -n <namespace> get jobs | rg metaboost-management-superuser
kubectl -n <namespace> logs -f job/<job-name>
```

### Option B — From your laptop (port-forward + repo)

**Port-forward** Postgres (or reach DB another way), ensure **`apps/management-api/.env`** has the same **`DB_*`** keys as management-api (**`DB_HOST`**, **`DB_PORT`**, **`DB_MANAGEMENT_NAME`**, **`DB_MANAGEMENT_READ_WRITE_USER`**, **`DB_MANAGEMENT_READ_WRITE_PASSWORD`**), then from Metaboost root:

```bash
node scripts/management-api/create-super-admin.mjs
```

Pass args explicitly when needed (for example `--prompt`, `-u/-p`, or `--random-password`).

### Option C — Ad hoc

**`kubectl exec`** or **`kubectl run --rm`** with the management-api image and equivalent env — team-specific.

---

## Step 13 — Verify deployment

**Do this:** Run the checks below with your real `<namespace>` and public hostnames. **Compile** overlays with
**`kubectl kustomize`** (Step 1). A **standalone `kustomize`** binary is **only** required if you run GitOps
scripts that invoke **`kustomize edit`** (see Step 1).

**Verify workloads and ingress in the cluster:**

```bash
kubectl -n <namespace> get pods,svc,ingress
kubectl -n <namespace> get certificate   # if using cert-manager Certificate resources
```

**Verify API health** (replace URL with your API base and path):

```bash
curl -sI https://api.example.com/v1/health
```

**Recommended before push — validate Kustomize overlays locally** (from your **GitOps** repo root; same
engine Argo uses via kubectl). This is a **dry run** of manifest compilation (no cluster writes):

```bash
kubectl kustomize apps/metaboost-<env>/api --load-restrictor LoadRestrictionsNone >/dev/null && echo "kustomize api overlay: ok"
# repeat per component: db, keyvaldb, management-api, web, management-web, common, …
```

**Remote git bases:** Overlays that use `resources:` URLs into this repo need
**`--load-restrictor LoadRestrictionsNone`** so kubectl’s Kustomize can read cloned paths outside
the overlay root (same behavior Argo CD uses for remote bases).

Open your web and management URLs in a browser.

**Why:** Confirms TLS, routing, and readiness.

---

## Quick reference — same commands in sequence

```bash
# Repos
git clone <metaboost> && git clone <gitops-repo>

# GitOps registration (gitops repo root, correct kube context)
kubectl apply --dry-run=server -f argocd/apps/<project>.yaml
kubectl apply --dry-run=server -f argocd/metaboost-<env>/
kubectl apply -f argocd/apps/<project>.yaml
kubectl apply -f argocd/metaboost-<env>/

# Registry secret (your process; then apply encrypted)
# ...

# Metaboost: alpha env + render
cd metaboost
make alpha_env_prepare_link
# edit ~/.config/metaboost/alpha-env-overrides/*.env
export METABOOST_K8S_OUTPUT_REPO=/absolute/path/to/gitops-repo
make alpha_env_render_dry_run && make alpha_env_validate && make alpha_env_render

# GitOps: sops encrypt plain secrets, commit, push
# kubectl apply --dry-run=server … then kubectl apply decrypted secrets to <namespace>

# Images: CI or local push; tags must match kustomization newTag

# Argo CD: sync common → db/keyvaldb → apis → webs
# Then: create-super-admin for management

# Optional: kustomize check from GitOps root (remote bases need LoadRestrictionsNone)
# kubectl kustomize apps/metaboost-<env>/api --load-restrictor LoadRestrictionsNone >/dev/null
```

---

## Related docs

- **Pins after each publish:** [METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md](../release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md).
- **Env render / make targets:** [K8S-ENV-RENDER.md](K8S-ENV-RENDER.md).
- **Variable catalog:** [ENV-REFERENCE.md](../env/ENV-REFERENCE.md).
- **Local k3d (contrast):** [K3D-ARGOCD-LOCAL.md](K3D-ARGOCD-LOCAL.md).
- **Where Argo Applications live:** [ARGOCD-GITOPS-METABOOST.md](ARGOCD-GITOPS-METABOOST.md).
- **Future beta/prod GitOps notes (placeholder):**
  [GITOPS-FUTURE-ENVIRONMENTS.md](GITOPS-FUTURE-ENVIRONMENTS.md).
- **Staging cutover:** [GITOPS-CUTOVER-STAGING-CHECKLIST.md](GITOPS-CUTOVER-STAGING-CHECKLIST.md).
- **Deployment checklist, sync order, team scripts:** maintain in **your GitOps repository** (this open-source Metaboost repo does not ship org-specific manifests).
