---
name: local-docker-env-alignment
description: When adding or changing preconditions, cleanup steps, or env usage for local Docker Compose, keep behavior aligned with shared infra/config/local/*.env and documented teardown flows.
---


# Local Docker Compose env alignment

## When to use

When you:

- Add or change **`make`** targets that touch **`infra/config/local/*.env`** or local containers (`metaboost_local_*`),
- Add guards to **`local_env_clean`** / **`local_clean`**, or
- Document local env setup / teardown.

Metaboost does **not** ship an in-repo local Kubernetes (k3d) path; cluster validation is **remote GitOps**.

## Do

- Keep **`local_env_clean`** blocked while **Docker Compose** Metaboost local containers are running (`make local_down` first).
- Keep **`local_clean`** as full teardown: **`local_down`**, **`local_down_volumes`**, **`test_clean`** (and any other documented test/E2E containers).
- Document that **`make local_env_setup`** and Compose share **`infra/config/local/*.env`** where applicable.

## Don't

- Reference k3d or `make local_k3d_*` (removed).

## Reference targets

- **`local_env_clean`**: Aborts if `metaboost_local_*` containers are running.
- **`local_clean`**: Docker + volumes + test stack teardown.
