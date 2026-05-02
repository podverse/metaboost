# metaboost-alpha-gitops-parity

## Context

GitOps parity: external **metaboost-alpha** overlays use immutable pins, dual web ConfigMap merges, `*-runtime-config` naming, strict contract scripts where maintained, docs, and CI.

---

### Session 1 - 2026-05-01

#### Prompt (Developer)

implement

#### Key Decisions

- Renamed generated runtime ConfigMaps in `infra/k8s/base/web` and `management-web` from `*-sidecar-config` to `*-runtime-config`; updated sidecar Deployment `configMapRef` names.
- Updated ENV vars docs and K8s alignment checklist to canonical paths and new ConfigMap names.
- Pointed Metaboost docs (`ARGOCD-GITOPS-METABOOST.md`, `REMOTE-K8S-GITOPS.md`, publish checklist) at a **separate GitOps repository** for canonical alpha overlays (pins are not maintained in this monorepo).
- Adjusted `argocd-gitops-push` skill to describe remote alpha overlays generically.

#### Files Created/Modified

- `infra/k8s/base/web/kustomization.yaml`
- `infra/k8s/base/web/deployment-web-sidecar.yaml`
- `infra/k8s/base/management-web/kustomization.yaml`
- `infra/k8s/base/management-web/deployment-management-web-sidecar.yaml`
- `docs/development/env/ENV-VARS-CATALOG.md`
- `docs/development/env/ENV-VARS-REFERENCE.md`
- `docs/development/repo-management/K8S-BASE-REFERENCE-ALIGNMENT-CHECKLIST-06A.md`
- `docs/development/k8s/ARGOCD-GITOPS-METABOOST.md`
- `docs/development/k8s/REMOTE-K8S-GITOPS.md`
- `docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md`
- `.cursor/skills/argocd-gitops-push/SKILL.md`
- `.llm/history/active/metaboost-alpha-gitops-parity/metaboost-alpha-gitops-parity-part-01.md`

**Companion GitOps repository:** immutable `?ref=…` + matching image tags on workload overlays; dual `configMapGenerator` merges for web/management-web; optional pin-contract automation (script/workflow) where that repo maintains it; README + alpha docs + secret-generator docs; removed stale internal history/plan pieces that contradicted pin policy.

---

### Session 2 - 2026-05-01

#### Prompt (Developer)

Metaboost.cc vs metaboost monorepo vs Podverse/k.podcastdj.com (alpha)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Fixed corrupted `newTag` lines in external GitOps `kustomization.yaml` files (Perl `\1` concatenated with a leading `0` from the tag mangled replacements); rewrote `bump-metaboost-alpha-pins.sh` to use `$ENV{MB_ALPHA_VERSION_TAG}` in the substitution.
- Deleted orphan `apps/metaboost-alpha/management-web/source/metaboost-management-web-sidecar-config.env`.
- Extended CI workflow path filters to include `scripts/bump-metaboost-alpha-pins.sh`.

#### Files Created/Modified

- GitOps repo: `apps/metaboost-alpha/api/kustomization.yaml`
- GitOps repo: `apps/metaboost-alpha/management-api/kustomization.yaml`
- GitOps repo: `apps/metaboost-alpha/web/kustomization.yaml`
- GitOps repo: `apps/metaboost-alpha/management-web/kustomization.yaml`
- GitOps repo: `.github/workflows/metaboost-alpha-contracts.yml`
- (deleted) GitOps repo: `apps/metaboost-alpha/management-web/source/metaboost-management-web-sidecar-config.env`
- `.llm/history/active/metaboost-alpha-gitops-parity/metaboost-alpha-gitops-parity-part-01.md`

---

### Session 3 - 2026-05-01

#### Prompt (Developer)

i think you can remove the "bump pins" script from both k.podcastdj.com and metaboost.cc if they each have one

#### Key Decisions

- Removed bump-pin automation script from the Metaboost GitOps repository; the Podverse operator GitOps repository had no matching bump script (only unrelated `scripts/lib/kustomize-overlay.inc.sh` helpers).
- Publish flow docs now describe **manual** `?ref=` / `newTag` edits plus `check_metaboost_alpha_version_contract.sh`.

#### Files Created/Modified

- (deleted) GitOps repo: `scripts/bump-metaboost-alpha-pins.sh`
- GitOps repo: `.github/workflows/metaboost-alpha-contracts.yml`
- GitOps repo: `README.md`
- `docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md`
- `.llm/history/active/metaboost-alpha-gitops-parity/metaboost-alpha-gitops-parity-part-01.md`

---

### Session 4 - 2026-05-01

#### Prompt (Developer)

@metaboost/docs/development/k8s/ARGOCD-GITOPS-METABOOST.md:27-31 we do not want comments like this talking about podverse or k.podcastdj.com within the metaboost or metaboost.cc repo. the only comment about k.podcastdj.com that should be within metaboost.cc is how cert-manager is setup in k.podcastdj.com for metaboost.cc and that explains why metaboost.cc does not have its own cert-manager right now

#### Key Decisions

- Removed comparative references to other products’ GitOps repositories from Metaboost GitOps docs, publish checklist, cutover checklist, `INFRA-K8S-BASE.md`, alignment checklists, and `argocd-gitops-push` skill.
- **External GitOps repository:** neutral README and overlay comments; **TLS and cert-manager** section documents cluster-wide cert-manager maintained outside that repo when applicable; scrubbed completed bootstrap plan text to “predecessor GitOps repository” where historical steps referred to the old repo.

#### Files Created/Modified

- `docs/development/k8s/ARGOCD-GITOPS-METABOOST.md`
- `docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md`
- `docs/development/k8s/GITOPS-CUTOVER-STAGING-CHECKLIST.md`
- `infra/k8s/INFRA-K8S-BASE.md`
- `.cursor/skills/argocd-gitops-push/SKILL.md`
- `docs/development/repo-management/K8S-BASE-REFERENCE-ALIGNMENT-CHECKLIST-06A.md`
- `docs/development/repo-management/K8S-ALPHA-APP-OF-APPS-REFERENCE-ALIGNMENT-CHECKLIST-06B.md`
- GitOps repo: `README.md`, `docs/k8s/metaboost-alpha/README.md`, `argocd/metaboost-alpha/ops.yaml`, `apps/metaboost-alpha/{api,web,management-web}/kustomization.yaml`
- GitOps repo: `.llm/plans/completed/metaboost-cc-alpha-gitops-bootstrap/` (multiple plan files)
- `.llm/history/active/metaboost-alpha-gitops-parity/metaboost-alpha-gitops-parity-part-01.md`

---

### Session 5 - 2026-05-01

#### Prompt (Developer)

we also do not want k.podcastdj.com mentioned within the podverse monorepo, and we do not want metaboost.cc mentioned within the metaboost monorepo, because these are open source projects and other developers will not be using those domains. if you need to talk about the separate GitOps repo, you should refer to them more generically like "the GitOps repo" or however you think best explains it

#### Key Decisions

- **Podverse:** removed `k.podcastdj.com` from ops migration docs and the `k8s` skill; GitOps paths described generically (`apps/<environment>/ops/...`).
- **Metaboost:** removed `metaboost.cc` from GitOps docs/skills/checklists; brand-domain examples use **`example.org`**; CronJob annotation prefixes use **`metaboost.example.org`** (RFC 2606-style placeholder); publish checklist references validation scripts generically.
- **LLM archives:** generalized historical paths in alignment plans/history where they named operator-specific repos.

#### Files Created/Modified

- Podverse: `docs/operations/DB-MIGRATIONS.md`, `.cursor/skills/k8s/SKILL.md`, `.llm/history/active/gitops-docs-domain-neutral/gitops-docs-domain-neutral-part-01.md`
- Metaboost: `docs/development/k8s/{ARGOCD-GITOPS-METABOOST.md,REMOTE-K8S-GITOPS.md,GITOPS-CUTOVER-STAGING-CHECKLIST.md}`, `docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md`, `docs/development/env/ENV-REFERENCE.md`, `infra/k8s/INFRA-K8S-BASE.md`, `infra/k8s/base/ops/*.cronjob.yaml`, `infra/k8s/base/{web,management-web}/source/*-sidecar.env`, `infra/config/env-templates/*-sidecar.env.example`, `apps/{web,management-web}/{src/config/env.ts,sidecar/.env.example}`, `.cursor/skills/argocd-gitops-push/SKILL.md`, `.llm/plans/completed/{metaboost-podverse-alignment,i18n-brand-env-vars}/**`, `.llm/history/active/{metaboost-alpha-gitops-parity,metaboost-podverse-alignment}/*.md`

---

### Session 6 - 2026-05-01

#### Prompt (Developer)

implement the plan, including optional work

#### Key Decisions

- Aligned Metaboost API mailer handling to Podverse-style split: keep `MAILER_HOST`/`MAILER_PORT`/`MAILER_FROM` in ConfigMap, move `MAILER_USERNAME`/`MAILER_PASSWORD` out of ConfigMap and source them from optional Secret `metaboost-mailer-opaque`.
- Implemented optional DB naming alignment by renaming K8s DB Service/Deployment identity from `postgres` to `metaboost-db` and updating all DB host references in base API, management-api, ops cronjobs, local stack, and external GitOps overlay env files.
- Kept local Docker Compose host convention `DB_HOST=postgres` documented for compose runtime, while clarifying that K8s manifests now use `metaboost-db`.

#### Files Created/Modified

- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/api/deployment.yaml`
- `infra/k8s/base/management-api/source/management-api.env`
- `infra/k8s/base/management-api/deployment.yaml`
- `infra/k8s/base/db/service-postgres.yaml`
- `infra/k8s/base/db/deployment-postgres.yaml`
- `infra/k8s/base/ops/db-migrate-app.cronjob.yaml`
- `infra/k8s/base/ops/db-migrate-management.cronjob.yaml`
- `infra/k8s/base/ops/management-superuser-create.cronjob.yaml`
- `infra/k8s/base/ops/management-superuser-update.cronjob.yaml`
- `infra/k8s/base/stack/services.yaml`
- `infra/k8s/base/stack/workloads.yaml`
- `infra/k8s/local/stack/service-exposure-patch.yaml`
- `infra/k8s/INFRA-K8S-BASE.md`
- `docs/development/k8s/K3D-ARGOCD-LOCAL.md`
- `infra/docker/local/INFRA-DOCKER-LOCAL.md`
- `metaboost.cc/apps/metaboost-alpha/api/source/api.env`
- `metaboost.cc/apps/metaboost-alpha/management-api/source/management-api.env`
- `metaboost.cc/apps/metaboost-alpha/api/deployment-secret-env.yaml`
- `.llm/history/active/metaboost-alpha-gitops-parity/metaboost-alpha-gitops-parity-part-01.md`

---

### Session 7 - 2026-05-01

#### Prompt (Developer)

K8s internal Service naming (Metaboost vs Podverse vs GitOps)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Renamed Metaboost Valkey **Service** DNS identity from `valkey` to **`metaboost-keyvaldb`** (Podverse-style product prefix); kept Deployment name `valkey` and selector `app: valkey`.
- Updated `KEYVALDB_HOST`, initContainer `nc -z` probes, local LoadBalancer patch, stack `services.yaml`, env catalogs for remote_k8s defaults, k3d/docker docs, and **metaboost.cc** alpha overlay env merges.

#### Files Created/Modified

- `infra/k8s/base/keyvaldb/service-valkey.yaml`
- `infra/k8s/base/stack/services.yaml`
- `infra/k8s/base/stack/workloads.yaml`
- `infra/k8s/local/stack/service-exposure-patch.yaml`
- `infra/k8s/base/api/deployment.yaml`
- `infra/k8s/base/api/source/api.env`
- `infra/k8s/base/management-api/deployment.yaml`
- `infra/k8s/base/management-api/source/management-api.env`
- `infra/k8s/INFRA-K8S-BASE.md`
- `docs/development/k8s/K3D-ARGOCD-LOCAL.md`
- `infra/docker/local/INFRA-DOCKER-LOCAL.md`
- `docs/development/env/ENV-VARS-CATALOG.md`
- `docs/development/env/ENV-VARS-REFERENCE.md`
- `metaboost.cc/apps/metaboost-alpha/api/source/api.env`
- `metaboost.cc/apps/metaboost-alpha/management-api/source/management-api.env`
- `.llm/history/active/metaboost-alpha-gitops-parity/metaboost-alpha-gitops-parity-part-01.md`
