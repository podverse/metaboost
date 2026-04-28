# K8s env (classification moved)

Workload env classification for GitOps rendering is **`infra/env/classification/base.yaml`** plus **`infra/env/overrides/*.yaml`**. The render pipeline is `scripts/k8s-env/render-k8s-env.sh` and `scripts/k8s-env/render_k8s_env.rb`. See `docs/development/k8s/K8S-ENV-RENDER.md`.
