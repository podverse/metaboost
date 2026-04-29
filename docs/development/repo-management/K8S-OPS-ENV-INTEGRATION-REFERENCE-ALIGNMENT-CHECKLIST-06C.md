# K8s Ops and Env Integration Reference Alignment Checklist (06C)

> Historical completed-phase artifact. Kept for traceability only.
> Current workflow is documented in `docs/development/k8s/REMOTE-K8S-GITOPS.md` and `docs/development/k8s/K8S-ENV-RENDER.md` (deprecated notice).

Date: 2026-04-28
Phase: 06c-k8s-ops-env-integration-verification

## Scope

- K8s env render and drift validation behavior for base/alpha overlays.
- Verification of template-driven env render/validation behavior in maintained k8s paths.
- Remote GitOps compatibility assumptions for rendered env/secret artifacts.

## Checklist

- [x] Maintained `scripts/k8s-env/*` render and drift paths use template/override-driven inputs only.
- [x] K8s env render dry-run succeeds for alpha and emits config env + secret patch outputs.
- [x] K8s docs for env render and remote GitOps reference only template/override-driven inputs.
- [x] External GitOps overlay contract remains `apps/metaboost-<env>/env/remote-k8s.env`.

## Verification Notes

Historical execution snapshot (not current operator instructions):

- `./scripts/nix/with-env bash scripts/k8s-env/render-k8s-env.sh --env alpha --dry-run` passed.
- `./scripts/nix/with-env bash scripts/k8s-env/validate-k8s-env-contract.sh` currently fails with `require_relative: cannot infer basepath` under the Nix wrapper; this failure pre-existed these edits and is tracked as follow-up.
- Maintained-source grep checks confirmed no deprecated env-render process references in active k8s env paths.

## Intentional Divergences

- None.
