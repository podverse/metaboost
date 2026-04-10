# k3s + ArgoCD + full Metaboost infra (local, step-by-step)

This guide gets a full Metaboost stack running locally: k3s (via k3d), ArgoCD, API, web, management API, management web, Postgres, and Valkey. All commands are run from the **Metaboost repo root**.

## What you get

- A local k3d (k3s-in-Docker) cluster.
- ArgoCD installed and a root app pointing at the Metaboost repo.
- Metaboost workloads in namespace `metaboost-local`: API, web (with sidecar), management API, management web (with sidecar), Postgres, Valkey.
- Env and secrets generated from templates (no Ansible; local only).

## Prerequisites

### Preferred: Nix / NixOS

We recommend using **Nix** or **NixOS** to get a reproducible environment with the right tools.

**Docker: use the host, not Nix.** To avoid two Docker runtimes and socket/context issues, **Docker (daemon + CLI) should come from your machine**, not from the Nix flake. The Metaboost flake provides `k3d`, `kubectl`, and `age` only. k3d will use whatever `docker` is on your PATH (e.g. Docker Desktop). So: keep Docker Desktop (or system Docker) installed and running; use Nix only for k3d, kubectl, and age. No special config or override is required.

- **With Nix (macOS/Linux, e.g. Docker Desktop already installed):** From repo root run `nix develop` (or `direnv allow` if you use direnv). The [flake.nix](../../flake.nix) supplies Node, k3d, kubectl, and age. Ensure Docker Desktop is running, then run `make local_k3d_up`. The script will use the host’s `docker` and the Nix-provided `k3d`/`kubectl`.
- **On NixOS:** Add `docker` (or your chosen Docker daemon), `k3d`, `kubectl`, and optionally `age` to `environment.systemPackages`, and enable the Docker daemon (`virtualisation.docker.enable = true`). Then run the steps from this guide from that system.

### Alternative: install without Nix

| Tool    | Purpose                  | Install (macOS)                                                                                 | Install (Linux)                                          |
| ------- | ------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Docker  | k3d and container images | [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/) or `brew install docker` | `apt install docker.io` / distro docs                    |
| k3d     | k3s cluster in Docker    | `brew install k3d`                                                                              | [k3d install](https://k3d.io/v5.6.0/usage/installation/) |
| kubectl | Kubernetes CLI           | `brew install kubectl`                                                                          | `apt install kubectl` / distro                           |

**Optional (only for SOPS/age in non-local envs):** `age` — e.g. `brew install age`. You do **not** need it for the local-only flow below.

## Step-by-step

### Step 1: Clone and go to repo root

```bash
git clone https://github.com/podverse/metaboost.git
cd metaboost
```

(Or use your fork; same steps.)

### Step 2: Bring up the full local stack

One command runs the full sequence (env setup, image build, cluster create, secrets, ArgoCD install, stack apply). If you use the Nix dev shell, run `nix develop` at repo root (so k3d and kubectl are on PATH), ensure Docker Desktop is running, then run:

```bash
make local_k3d_up
```

This script (`scripts/infra/k3d/local-up.sh`) does the following in order:

1. **Env setup** – `scripts/local-env/setup.sh`: ensures `infra/config/local/*.env` and app `.env` files exist (generates missing keys from classification `dev` / `local_docker` profiles; applies overrides from `dev/env-overrides/local/` if present).
2. **Build images** – builds local Docker images (api, management-api, web, web-sidecar, management-web, management-web-sidecar) and tags them for k3d.
3. **Create k3d cluster** – creates cluster `metaboost-local` if it does not exist, with ports 4000, 4002, 4100, 4102, 5532, 6479 exposed. **Note:** An existing cluster created before this port change keeps its old loadbalancer maps until you delete and recreate the cluster (e.g. `k3d cluster delete metaboost-local` then `make local_k3d_up`).
4. **Import images** – loads the built images into the k3d cluster.
5. **Create Kubernetes secrets** – `scripts/infra/k3d/create-local-secrets.sh`: creates secrets named **`metaboost-<component>-secrets`** in `metaboost-local` from `infra/config/local/*.env` (the **`db`** secret uses **`infra/config/local/db.env`** only).
6. **Install ArgoCD** – installs ArgoCD in the `argocd` namespace and waits for the server.
7. **Bootstrap ArgoCD** – applies `infra/k8s/argocd-project.yaml`, `infra/k8s/local-application.yaml` (parent app), and `infra/k8s/argocd/metaboost-local-stack-application.yaml` (stack Application CR from disk).
8. **Apply local stack** – `kubectl apply -k infra/k8s/local/stack` from your **working tree**. The stack Application uses **manual** sync only, and the parent app no longer auto-syncs with self-heal, so this is not reset to GitHub on every reconcile. Use **Sync** on `metaboost-local-stack` in Argo CD when you want the cluster to match the Git revision in that Application.

When it finishes, it prints the app URLs.

### Step 3: Verify workloads

```bash
make local_k3d_status
```

You should see pods and services in `metaboost-local`. Wait until pods are `Running` (and optionally `Ready`). First run can take a minute while images start.

### Step 4: Use the apps

| App            | URL                   |
| -------------- | --------------------- |
| API            | http://localhost:4000 |
| Web            | http://localhost:4002 |
| Management API | http://localhost:4100 |
| Management Web | http://localhost:4102 |
| Postgres       | localhost:5532        |
| Valkey         | localhost:6479        |

### Step 5: Open ArgoCD UI (optional)

```bash
make local_argocd_port_forward
```

Then open **https://localhost:8080** in a browser (accept the TLS warning for local). The local app-of-apps points at the Metaboost repo; you can inspect sync and apps here.

**Login (local dev default):** Use username **`localdev`** and password **`Test!1Aa`**. The built-in **`admin`** account is set to the same password so you can use either. These defaults are configured automatically by `scripts/infra/argocd/local-dev-user.sh` when you run `make local_k3d_up`; do not use in production.

### Step 6: Tear down

When you are done:

```bash
make local_k3d_down
```

This removes the k3d cluster and all resources in it. For a full local teardown (Docker Compose, test containers, and k3d), use `make local_clean`.

---

## Troubleshooting

- **Cluster already exists:** `make local_k3d_up` is idempotent for cluster create (skips if `metaboost-local` exists). It will still run env setup, build images, import them, recreate secrets, re-apply ArgoCD and the local stack.
- **k3d cluster creation fails with "proxyconnect tcp ... i/o timeout":** Docker is using an HTTP proxy to pull images and the proxy connection is timing out. Fix in Docker Desktop: open **Settings → Resources → Proxies**. For **Docker Desktop proxy**, select **No proxy**. For **Containers proxy**, select **No proxy**. Click **Apply**, then run `make local_k3d_up` again. (If you must use a proxy, choose Manual configuration and set a working HTTP/HTTPS proxy that can reach `ghcr.io` and `docker.io`; otherwise use No proxy for local k3d.)
- **Ports in use:** Ensure 4000, 4002, 4100, 4102, 5532, 6479, and (for ArgoCD) 8080 are free. Change k3d port mapping in `scripts/infra/k3d/local-up.sh` if you need different host ports.
- **Pods not ready:** Run `make local_k3d_status` and `kubectl -n metaboost-local describe pod <name>` for events. Check that DB and Valkey pods are up first; API and web depend on them.
- **API/web/management pods show `ImagePullBackOff` for `metaboost-local-*` images:** This means the app images were not present on one or more k3d nodes. `local_k3d_up` now validates imported images and exits early with an explicit error if any are missing. Re-run `make local_k3d_down` and then `make local_k3d_up`. To inspect node images directly: `docker exec k3d-metaboost-local-server-0 crictl images` and `docker exec k3d-metaboost-local-agent-0 crictl images`.
- **Node events show `NodeHasDiskPressure` / `FreeDiskSpaceFailed`:** k3d nodes are running out of image disk and kubelet image garbage collection is evicting app images during startup/import. This can produce `ImagePullBackOff` and localhost connection resets even though `local_k3d_up` built images successfully. Fix by freeing Docker disk and increasing Docker Desktop disk image size (and memory if needed), then rerun: `make local_k3d_down && make local_k3d_up`.
- **ArgoCD sync:** The parent `metaboost-local` and child `metaboost-local-stack` Applications use **manual** sync (no automated self-heal). `local-up.sh`’s `kubectl apply -k infra/k8s/local/stack` stays in effect for workloads. Argo CD may show **OutOfSync** until you choose **Sync** in the UI. The stack Application spec is defined in `infra/k8s/argocd/metaboost-local-stack-application.yaml` (applied from disk during bootstrap), not under `infra/k8s/local/apps/`.
- **Empty reply / connection reset on localhost:4000, 4100, or flaky web:** Often caused by API pods crash-looping because Kubernetes **service environment variables** collided with app vars (for example `API_PORT` set to `tcp://…` for a Service named `api`). The stack manifests disable service links on workload pods and set explicit listen ports. If you still see drift, run `kubectl -n metaboost-local logs deploy/api` and confirm pods are `1/1 Ready`.
- **ArgoCD login (cluster created before local-dev-user was added):** To get the default `localdev` / `Test!1Aa` login on an existing cluster, run once from repo root: `bash scripts/infra/argocd/local-dev-user.sh`. Otherwise, use username **admin** and retrieve the password with: `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo`.
- **"metadata.annotations: Too long: must have at most 262144 bytes" when installing Argo CD:** The install script uses server-side apply to avoid this. If you see it, ensure you are on the latest `install.sh`. If you had a partial install, tear down with `make local_k3d_down` and run `make local_k3d_up` again.
- **"timed out waiting for the condition on deployments/argocd-server":** The ArgoCD server deployment did not become ready within the wait window (600s). First run can be slow due to image pulls. Check status: `kubectl -n argocd get pods`, `kubectl -n argocd describe deployment argocd-server`, and `kubectl -n argocd logs deployment/argocd-server --tail=50`. If pods are **Pending** (e.g. "0/N nodes available: insufficient memory"), give Docker more resources (Docker Desktop: **Settings → Resources**: at least 4 GB memory, 2 CPUs). Then run `make local_k3d_down` and `make local_k3d_up` again. If pods are **ImagePullBackOff** or **ErrImagePull**, check network/proxy and retry.
- **"password authentication failed for user metaboost_app_read":** This means the password Postgres used when creating the DB user (at first init) does not match the password the API is using. It usually happens after changing DB passwords or recreating `infra/config/local/*.env` while the cluster was already up: Postgres keeps the old user passwords, but the API gets the new ones from the updated secrets. To fix: (1) Recreate env and secrets from repo root: `make local_env_setup` then `bash scripts/infra/k3d/create-local-secrets.sh`. (2) Force Postgres to re-run init by deleting its data: `make local_k3d_postgres_reset` (or manually: `kubectl -n metaboost-local delete pvc metaboost-postgres-data` and `kubectl -n metaboost-local delete pod -l app=postgres`). Wait for the new Postgres pod to be ready (init will run and create users with the current secrets). (3) Restart the API and management-api: `kubectl -n metaboost-local rollout restart deployment api management-api`. After that, the API and management-api should connect successfully.

## Notes

- Local flow uses `scripts/local-env/setup.sh` and `infra/config/local/*.env`; it does not use Ansible.
- **Same env files for Docker and k3d:** The same `infra/config/local/*.env` set is used for both the Docker Compose path (`make local_infra_up` / `docker compose -f infra/docker/local/docker-compose.yml ...`) and the k3d path (`make local_k3d_up`). The templates use in-network service names (`DB_HOST=postgres`, `VALKEY_HOST=valkey`, `DB_PORT=5432`, `VALKEY_PORT=6379`), which work in both Docker’s network and in the k3d cluster (where the K8s services are also named `postgres` and `valkey`). You do not need separate env files for each.
- `infra/k8s/argocd/metaboost-local-stack-application.yaml` sets `targetRevision` for the stack (branch Argo CD uses when you **Sync** that app). Align with your workflow (e.g. `feature/k8s-alpha`, `main`, or `develop`).
- For more on infra layout and k8s, see [infra/k8s/INFRA-K8S.md](../../infra/k8s/INFRA-K8S.md) and [infra/INFRA.md](../../infra/INFRA.md).

## SOPS + age (optional; for non-local envs)

For **local-only** use you do not need SOPS or age. Secrets are plain env files under `infra/config/local/`.

When you later add **non-local** environments (e.g. alpha), you can:

1. Generate an age key: `bash scripts/infra/sops/generate-age-key.sh` (writes `.secrets/age.key`).
2. Manage encrypted manifests in your **GitOps deployment repo** (not in this tree): follow [K8S-ENV-RENDER.md](K8S-ENV-RENDER.md) to render ConfigMaps and cleartext Secrets into `METABOOST_K8S_OUTPUT_REPO`, then encrypt with SOPS and commit there.
