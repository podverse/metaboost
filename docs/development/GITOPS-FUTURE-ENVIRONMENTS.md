# GitOps: future beta and production work (not implemented)

This file is a **placeholder for later implementation**. It records intent so beta/prod automation
can be added without re-deriving the design.

## Beta

- **Images:** Reuse the same pre-release stream as alpha (e.g. `X.Y.Z-staging.N` and the floating
  `:staging` tag once the publish workflow uses that naming). Beta does not require a separate
  build if alpha and beta only differ by **which pin** they deploy.
- **GitOps:** Maintain a **separate overlay** (e.g. `apps/boilerplate-beta/`) with its own
  `newTag` / `targetRevision` (or `?ref=`) so beta can **lag** alpha until operators bump it.
- **CI (future):** Add automation in **your GitOps repo** (or a separate orchestrator) for
  multi-env bumps—e.g. manifest-driven patches, `workflow_dispatch`, or env-specific jobs—**not
  implemented** in the Boilerplate app repo.

## Production promotion

**Deferred:** no `promote-to-prod` workflow or prod GitOps bump ships in this repo yet. When
implementing:

- **Registry:** Point a **release semver** tag (e.g. `1.0.0`) at the **same manifest digest** as a
  chosen staging tag (e.g. `1.0.0-staging.5`), e.g. **crane copy** or **docker buildx imagetools
  create**—no rebuild if policy allows digest-only promotion.
- **GitOps:** Bump prod overlays in a **separate workflow** or job, ideally **`workflow_dispatch`**
  with environment protection.
- **Git on `main`:** Optional release tags on the app repo are orthogonal to registry tags.

## Related

- [ARGOCD-GITOPS-BOILERPLATE.md](ARGOCD-GITOPS-BOILERPLATE.md) — where Applications and overlays
  live.
- [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) — render, SOPS, sync order.
