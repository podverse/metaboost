## Plan 02: Terminology Cleanup for Current Env Process

## Objective
Remove lingering "template contract" wording in maintained docs/comments where it now causes process ambiguity versus the intended template/example + GitOps ownership model.

## Steps
1. Search maintained source/docs for `template contract` and classify each hit:
   - required historical/archive context,
   - active contributor guidance,
   - code comments/messages.
2. Rewrite active guidance to use precise current terminology:
   - canonical templates/examples,
   - local env setup scripts,
   - external GitOps ownership for remote k8s env/manifests/secrets.
3. Keep historical references only in archived plan/history files where needed for traceability.
4. Re-run targeted searches and ensure no conflicting process language remains in maintained paths.

## Relevant Files
- `AGENTS.md`
- `README.md`
- `infra/INFRA.md`
- `docs/development/env/ENV-REFERENCE.md`
- `docs/development/env/LOCAL-ENV-OVERRIDES.md`
- `apps/api/src/config/index.ts`
- `apps/api/src/lib/startup/validation.ts`
- `apps/management-api/src/config/index.ts`
- `apps/management-api/src/lib/startup/validation.ts`

## Verification
1. `rg -n "template contract|infra/env/template contract|scripts/env-template contract" AGENTS.md README.md docs infra scripts apps packages` only returns intentional archive/historical lines.
2. Env docs still describe local setup commands accurately (`make local_env_prepare`, `make local_env_link`, `make local_env_setup`).
