# env-file-next-public-order

## Started

2026-05-03

### Session 1 - 2026-05-03

#### Prompt (Developer)

@podverse/infra/k8s/base/management-web/source/management-web-sidecar.env:12-14 sweep through all the podverse and metaboost env files. we always want the non NEXT_PUBLIC_* env vars to appear above the NEXT_PUBLIC_* env vars. add or update a skill if needed to remember.

#### Key Decisions

- Reordered `infra/k8s/base/web/source/web-sidecar.env` and `infra/k8s/base/management-web/source/management-web-sidecar.env` so internal/service keys precede all `NEXT_PUBLIC_*`.
- Added `.cursor/skills/env-file-formatting/SKILL.md` and documented ordering in `.cursor/rules/env-file-formatting.mdc`.

#### Files Created/Modified

- `infra/k8s/base/web/source/web-sidecar.env`
- `infra/k8s/base/management-web/source/management-web-sidecar.env`
- `.cursor/skills/env-file-formatting/SKILL.md`
- `.cursor/rules/env-file-formatting.mdc`
