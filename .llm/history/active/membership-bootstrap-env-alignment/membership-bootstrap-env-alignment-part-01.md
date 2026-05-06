# membership-bootstrap-env-alignment

**Started:** 2026-05-06  
**Author:** Cursor Agent  
**Context:** Rename membership product bootstrap env keys to the shared `MEMBERSHIP_*` convention.

---

### Session 1 - 2026-05-06

#### Prompt (Developer)

Align Metaboost membership bootstrap env keys with Podverse naming

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Renamed `FREE_TRIAL_EXPIRATION` → `MEMBERSHIP_FREE_TRIAL_EXPIRATION`, `PREMIUM_MEMBERSHIP_COST_MONTHLY` → `MEMBERSHIP_PREMIUM_COST_MONTHLY`, `PREMIUM_MEMBERSHIP_COST_ANNUALLY` → `MEMBERSHIP_PREMIUM_COST_ANNUALLY` in helpers, ORM, both apps’ startup validation, env examples, infra templates, and K8s `product-membership` ConfigMap source; updated K8s cross-comments in `api.env` and `management-api.env`.
- Refreshed `env-expiration-naming` skill examples to use the new membership env keys; no backward-compat dual-read of legacy names.

#### Files Created/Modified

- `packages/helpers/src/membership/productMembershipDefaultsFromEnv.ts`
- `packages/orm/src/lib/freeTrialExpirationSeconds.ts`
- `packages/orm/src/lib/defaultMembershipExpiresAt.ts`
- `apps/api/src/lib/startup/validation.ts`
- `apps/management-api/src/lib/startup/validation.ts`
- `apps/api/.env.example`
- `apps/management-api/.env.example`
- `infra/config/env-templates/api.env.example`
- `infra/config/env-templates/management-api.env.example`
- `infra/k8s/base/product-membership/source/product-membership-defaults.env`
- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/management-api/source/management-api.env`
- `.cursor/skills/env-expiration-naming/SKILL.md`
- `.llm/history/active/membership-bootstrap-env-alignment/membership-bootstrap-env-alignment-part-01.md`
