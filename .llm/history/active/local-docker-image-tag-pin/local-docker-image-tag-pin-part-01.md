# local-docker-image-tag-pin

Started: 2026-05-01  
Author: assistant  
Context: **K8s only:** explicit pins for `metaboost-local-*` in `workloads.yaml` (no `:latest`). **Local Docker / Compose:** `:latest`. **k3d builds:** dual-tag `latest` + pinned tag so imports match manifests.

### Session 1 - 2026-05-01

#### Prompt (Developer)

check metaboost and metaboost.cc for any examples where a "latest" tag is used. we want everything hard coded to X.X.X-staging.N for now

#### Key Decisions

- Replaced **Metaboost** `metaboost-local-*` and compose `metaboost-*` image tags; **metaboost.cc** had no `:latest` uses (no edits).
- Left **third-party** images unchanged (e.g. `dpage/pgadmin4:latest`, `postgres:18.3`, `valkey/valkey:7-alpine`).
- `Makefile.local.validate.mk` still uses `:test` tags for CI-style docker builds (unchanged).

#### Files Created/Modified

- `infra/k8s/base/stack/workloads.yaml`
- `scripts/infra/k3d/build-images.sh`
- `scripts/infra/k3d/local-up.sh`
- `infra/docker/local/docker-compose.yml`
- `infra/docker/local/api/docker-compose.yml`
- `infra/docker/local/web/docker-compose.yml`
- `infra/docker/local/web-sidecar/docker-compose.yml`
- `makefiles/local/Makefile.local.docker.mk`

### Session 2 - 2026-05-01

#### Prompt (Developer)

i gave you the wrong instructions. we can keep latest for images that are used locally. we only want to make sure latest is not used within k8s context

#### Key Decisions

- Reverted **Docker Compose** and **`local_prune_metaboost_images`** to `metaboost-*:latest`.
- Kept **`infra/k8s/base/stack/workloads.yaml`** on explicit `metaboost-local-*:X.X.X-staging.N` (no `:latest` in that K8s manifest).
- **`build-images.sh`:** dual-tag each `metaboost-local-*` image as `:latest` and `:${METABOOST_LOCAL_K8S_IMAGE_TAG:-X.X.X-staging.N}` so Compose-oriented `latest` and K8s pins refer to the same build.
- **`local-up.sh`:** `LOCAL_IMAGES` uses `METABOOST_LOCAL_K8S_IMAGE_TAG` (same default) so k3d import matches workload image refs.

#### Files Created/Modified

- `scripts/infra/k3d/build-images.sh`
- `scripts/infra/k3d/local-up.sh`
- `infra/docker/local/docker-compose.yml`
- `infra/docker/local/api/docker-compose.yml`
- `infra/docker/local/web/docker-compose.yml`
- `infra/docker/local/web-sidecar/docker-compose.yml`
- `makefiles/local/Makefile.local.docker.mk`
