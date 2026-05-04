### Session 1 - 2026-05-03

#### Prompt (Developer)

Metaboost Trust Foundation (Schema-Only)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Implement schema-only trust foundations in Metaboost without runtime gating behavior changes.
- Add a dedicated `user_trust_settings` table with backfill and constraints, but no API gating usage yet.
- Keep auth middleware (`requireAuth`) unchanged to guarantee no behavioral regressions.

#### Files Created/Modified

- .llm/history/active/metaboost-trust-foundation-schema/metaboost-trust-foundation-schema-part-01.md
- infra/k8s/base/ops/source/database/linear-migrations/app/0004_user_trust_and_entitlement_overrides.sql
- infra/k8s/base/ops/kustomization.yaml
- infra/k8s/base/api/source/api.env
- packages/orm/src/entities/UserTrustSettings.ts
- packages/orm/src/entities/User.ts
- packages/orm/src/data-source.ts
- packages/orm/src/index.ts
- packages/helpers/src/trust/constants.ts
- packages/helpers/src/index.ts
