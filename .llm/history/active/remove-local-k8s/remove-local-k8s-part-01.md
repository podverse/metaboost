# remove-local-k8s

Started: 2026-05-01

### Session 1 - 2026-05-01

#### Prompt (Developer)

Metaboost local k8s: keep or remove?

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Removed in-repo k3d toolchain (prior session): scripts, `infra/k8s/local`, local Argo apps, `Makefile.local.k3d.mk`.
- Finished doc/skill/narrative cleanup: stub `K3D-ARGOCD-LOCAL.md`, `INFRA-K8S-BASE.md` verify steps, `ARGOCD-GITOPS-METABOOST.md`, `infra/INFRA.md`, env overrides/reference, `REMOTE-K8S-POSTGRES-REINIT.md`, alignment checklists 06A/06B, `argocd-project.yaml` (drop `metaboost-local` destination), `flake.nix` (drop `k3d` + shellHook line), rewrote **argocd-gitops-push** and replaced **local-docker-k3d-alignment** with **local-docker-env-alignment**, **linear-db-migrations** wording.

#### Files Created/Modified

- docs/development/k8s/K3D-ARGOCD-LOCAL.md
- infra/k8s/INFRA-K8S-BASE.md
- docs/development/k8s/ARGOCD-GITOPS-METABOOST.md
- infra/INFRA.md
- docs/development/env/LOCAL-ENV-OVERRIDES.md
- docs/development/env/ENV-REFERENCE.md
- docs/development/k8s/REMOTE-K8S-POSTGRES-REINIT.md
- docs/development/repo-management/K8S-BASE-REFERENCE-ALIGNMENT-CHECKLIST-06A.md
- docs/development/repo-management/K8S-ALPHA-APP-OF-APPS-REFERENCE-ALIGNMENT-CHECKLIST-06B.md
- infra/k8s/argocd-project.yaml
- flake.nix
- .cursor/skills/argocd-gitops-push/SKILL.md
- .cursor/skills/local-docker-env-alignment/SKILL.md (new)
- .cursor/skills/linear-db-migrations/SKILL.md
- (removed) .cursor/skills/local-docker-k3d-alignment/SKILL.md
