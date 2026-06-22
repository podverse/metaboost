# metaboost-kustomize-podverse-composition

**Started:** 2026-05-06  
**Author:** Cursor Agent  
**Context:** Align Metaboost Kustomize with Podverse — no `../` sibling bases in component bases;
compose `base/product-membership` in overlays; remote `alpha/ops`.

---

### Session 1 - 2026-05-06

#### Prompt (Developer)

Metaboost Kustomize: Podverse-style composition (no `../` in bases)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Removed `../product-membership` from `base/api` and `base/management-api`; composed `base/product-membership` in `alpha/api` and `alpha/management-api` via remote Git URLs (same `?ref=` as component base), matching Podverse.
- Replaced `alpha/ops` filesystem `../../base/ops` with remote `base/ops` URL; updated INFRA-K8S revision policy accordingly.
- Extended `kustomize-build-metaboost-bases.sh` and INFRA-K8S-BASE manual loop to include `product-membership`.
- Documented api/management-api dual-remote requirement in METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.
- Added `.cursor/skills/k8s/SKILL.md` and INDEX entry.

#### Files Created/Modified

- `infra/k8s/base/api/kustomization.yaml`
- `infra/k8s/base/management-api/kustomization.yaml`
- `infra/k8s/alpha/api/kustomization.yaml`
- `infra/k8s/alpha/management-api/kustomization.yaml`
- `infra/k8s/alpha/ops/kustomization.yaml`
- `infra/k8s/INFRA-K8S.md`
- `infra/k8s/INFRA-K8S-BASE.md`
- `scripts/k8s/kustomize-build-metaboost-bases.sh`
- `docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md`
- `.cursor/skills/k8s/SKILL.md`
- `.cursor/skills/INDEX.md`
