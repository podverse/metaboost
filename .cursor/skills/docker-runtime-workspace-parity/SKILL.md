---
name: docker-runtime-workspace-parity
description: Prevents workspace package omissions in Docker images by verifying runtime-stage COPY coverage for every app dependency. Use when editing Dockerfiles, debugging ERR_MODULE_NOT_FOUND in containers, or changing workspace dependencies.
---

# Docker Runtime Workspace Parity (Metaboost)

Use this skill when editing Metaboost Dockerfiles or workspace dependencies.

## Why

Builder stages can compile successfully while runtime stages fail if a workspace package is not copied into the final image.

Typical failures:

- `ERR_MODULE_NOT_FOUND`
- Missing package like `@metaboost/orm` at container startup

## Slim runtime stage (selective COPY)

When a Dockerfile uses **selective** `COPY --from=builder` (not full `packages/`):

1. Identify all `@metaboost/*` dependencies in the target app's `package.json`.
2. In the runtime stage, verify each dependency package has both:
   - `COPY --from=builder .../package.json ...`
   - `COPY --from=builder .../dist/ ...`
3. If a dependency is missing, add both COPY lines.
4. Rebuild the image and confirm runtime startup/module import works.

## Local Docker layout (`infra/docker/local/**`)

Metaboost local Dockerfiles generally **`COPY packages/ ./packages/`** (whole tree). That still requires:

1. **Root `package.json` workspaces** includes the new package path.
2. **`package-lock.json`** updated after dependency changes.
3. **`npm run build:packages`** includes the new package in dependency-safe order — see **build-order** skill and [.llm/context/architecture.md](/.llm/context/architecture.md).

If a Dockerfile **does not** copy all of `packages/`, apply the slim runtime checklist above.

## Scope

Primary paths:

- [`infra/docker/local/api/Dockerfile`](/infra/docker/local/api/Dockerfile)
- [`infra/docker/local/management-api/Dockerfile`](/infra/docker/local/management-api/Dockerfile)
- [`infra/docker/local/web/Dockerfile`](/infra/docker/local/web/Dockerfile)
- [`infra/docker/local/management-web/Dockerfile`](/infra/docker/local/management-web/Dockerfile)
- Sidecar Dockerfiles under the same directory

Also apply to any new Metaboost Dockerfile or CI image that builds from this monorepo.

## Fast verification pattern

From monorepo root, after Dockerfile edits:

```bash
docker build -f infra/docker/local/api/Dockerfile -t metaboost-api:test .
```

Use the Dockerfile path for the app you changed.
