### Session 1 - 2026-05-06

#### Prompt (Developer)

Metaboost: move `product-membership` to `alpha/common`

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Compose `base/product-membership` only in `infra/k8s/alpha/common` with `namespace: metaboost-alpha`; remove
  from `alpha/api` and `alpha/management-api`.
- Update INFRA-K8S, INFRA-K8S-BASE, METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST, k8s SKILL, and env cross-comments.

#### Files Modified

- infra/k8s/alpha/common/kustomization.yaml
- infra/k8s/alpha/api/kustomization.yaml
- infra/k8s/alpha/management-api/kustomization.yaml
- infra/k8s/INFRA-K8S.md
- infra/k8s/INFRA-K8S-BASE.md
- docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md
- .cursor/skills/k8s/SKILL.md
- infra/k8s/base/product-membership/source/product-membership-settings.env
- infra/k8s/base/management-web/source/management-web-sidecar.env
- .llm/history/active/product-membership-metaboost-common/product-membership-metaboost-common-part-01.md
