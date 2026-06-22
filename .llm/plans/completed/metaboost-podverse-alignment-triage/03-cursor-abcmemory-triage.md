# 03 — Cursor abcmemory Additions Triage

## Scope

"abcmemory" = committed Cursor agent guidance under `.cursor/` plus `.cursorrules` / `.cursorignore`.
This theme triages MetaBoost's **new and modified** abcmemory files and aligns them with Podverse's
equivalents (content, naming, and structure). Podverse is the source of truth for what these rules
and skills should say.

Podverse has `.cursor/hooks/` and `.cursor/prompts/`, so MetaBoost adding them aligns. Podverse has
74 skills vs MetaBoost's 69, and a broader rule set; the bidirectional gap accounting is owned by
Plan 09, but this plan triages the specific files MetaBoost has changed/added.

## Changed paths

New (untracked):

- `.cursor/hooks/`, `.cursor/hooks.json` (if present), `.cursor/prompts/`
- `.cursor/rules/CURSOR-RULES.md`, `.cursor/rules/abcmemory-vocabulary.mdc`,
  `.cursor/rules/app-local-ui-wrappers.mdc`, `.cursor/rules/architecture-tier-dependencies.mdc`,
  `.cursor/rules/css-custom-properties-no-var-fallbacks.mdc`,
  `.cursor/rules/import-specifiers-tiered.mdc`
- `.cursor/skills/CURSOR-SKILLS.md`, `.cursor/skills/abcmemory/`,
  `.cursor/skills/docker-runtime-workspace-parity/`, `.cursor/skills/import-specifiers-tiered/`,
  `.cursor/skills/management-post-save-navigation/`

Modified:

- `.cursorrules`, `.cursorignore`, `.cursor/skills/INDEX.md`
- Many `.cursor/rules/*.mdc` and `.cursor/skills/*/SKILL.md` (see `git diff --stat` for the full list:
  e.g. `api`, `argocd-gitops-push`, `documentation-conventions`, `e2e-page-tests`,
  `env-file-formatting`, `global`, `k8s`, `linear-db-migrations`, `llm-cursor-source`,
  `plan-files-convention`, `response-ending-make-verify`, `reusable-components`,
  `storybook-component-docs`).

## Triage method

For each new/modified MetaBoost abcmemory file:

1. Find the Podverse counterpart (same rule/skill name under `podverse/.cursor/`). For example
   `abcmemory-vocabulary.mdc`, `architecture-tier-dependencies.mdc`,
   `css-custom-properties-no-var-fallbacks.mdc`, `import-specifiers-tiered.mdc`, and the `abcmemory`
   skill all exist in Podverse.
2. Diff the MetaBoost version against Podverse's. Classify:
   - identical-intent (only repo-name/path differences) → KEEP.
   - drifted content (Podverse has newer/clearer guidance) → ALIGN (port Podverse's wording).
   - MetaBoost-specific with no Podverse counterpart → KEEP, but note for Plan 09 (candidate for
     Podverse adoption or intentional divergence).
3. Validate index/aggregation files are consistent: `.cursor/skills/INDEX.md`,
   `.cursor/rules/CURSOR-RULES.md`, `.cursor/skills/CURSOR-SKILLS.md` should list exactly the files
   that exist. Flag any missing/extra entries.
4. Confirm `.cursorrules` and `.cursorignore` changes match Podverse's structure/intent where the
   topics overlap.
5. Verify hooks/prompts: compare `.cursor/hooks/` and `.cursor/prompts/` to Podverse
   (`CURSOR-HOOKS.md`, `CURSOR-PROMPTS.md`) for structural parity.

## Expected decisions

| File group                                  | Decision | Notes                                              |
| ------------------------------------------- | -------- | -------------------------------------------------- |
| new hooks / prompts                         | KEEP     | aligns; confirm structure matches Podverse          |
| rules with Podverse counterparts            | TBD      | KEEP if matched; ALIGN if drifted                   |
| skills with Podverse counterparts           | TBD      | KEEP if matched; ALIGN if drifted                   |
| MetaBoost-only rules/skills                 | KEEP     | note in Plan 09 for adoption/divergence decision    |
| INDEX / CURSOR-RULES / CURSOR-SKILLS        | TBD      | ALIGN if listings are stale                          |

## Decisions

**Executed:** 2026-06-21  
**Podverse check:** `.cursor/hooks/` and `.cursor/prompts/` match Podverse byte-for-byte; Podverse has
no `INDEX.md` (MetaBoost-specific quick-ref — **KEEP**).

### New / untracked abcmemory

| Path | Decision | Notes |
| --- | --- | --- |
| `.cursor/hooks/`, `.cursor/prompts/` | **KEEP** | Identical to Podverse (`CURSOR-HOOKS.md`, `CURSOR-PROMPTS.md`) |
| `.cursor/rules/CURSOR-RULES.md` | **KEEP** | Identical to Podverse |
| `.cursor/skills/CURSOR-SKILLS.md` | **KEEP** | Identical to Podverse |
| `.cursor/rules/abcmemory-vocabulary.mdc` | **KEEP** | Matches Podverse |
| `.cursor/rules/architecture-tier-dependencies.mdc` | **KEEP** | Matches Podverse |
| `.cursor/rules/import-specifiers-tiered.mdc` | **KEEP** | Matches Podverse |
| `.cursor/rules/css-custom-properties-no-var-fallbacks.mdc` | **ALIGN** | Drift: token source paths (`_themes.scss` vs Podverse `_variables-root.scss` + `_themes.scss`) |
| `.cursor/skills/abcmemory/` | **ALIGN** | Minor formatting/table drift vs Podverse; port PV table alignment |
| `.cursor/skills/docker-runtime-workspace-parity/` | **ALIGN** | Drift vs Podverse; port with `@metaboost/*` paths |
| `.cursor/skills/import-specifiers-tiered/` | **ALIGN** | Drift vs Podverse; port with MB doc paths |
| `.cursor/skills/management-post-save-navigation/` | **ALIGN** | Drift vs Podverse; port with MB routes/apps |
| No `.cursor/hooks.json` | **KEEP** | Podverse also has no `hooks.json` (placeholder dirs only) |

### Modified shared abcmemory (drift vs Podverse)

| Path | Decision | Notes |
| --- | --- | --- |
| `.cursor/rules/end-with-targeted-make-report-verify.mdc` | **ALIGN** | Port Podverse wording; **retain** MetaBoost `E2E_API_GATE_MODE` default-off policy |
| `.cursor/rules/plan-creation.mdc` | **ALIGN** | Minor drift; align to Podverse (same `.llm/plans/active/` convention) |
| `.cursor/skills/llm-cursor-source/` | **ALIGN** | Post-exports rewrite drift; port Podverse cursor-only policy |
| `.cursor/skills/response-ending-make-verify/` | **ALIGN** | Port Podverse; keep MB make targets / API gate notes |
| `.cursor/skills/reusable-components/` | **ALIGN** | Port Podverse; adapt `@metaboost/ui` + app names |
| Other modified skills (`api`, `k8s`, `global`, etc.) | **KEEP** | Repo-specific paths; spot-check during stage-2 only if touched by 03-port plan |

### MetaBoost-only (no Podverse counterpart)

| Path | Decision | Notes |
| --- | --- | --- |
| `api-no-pii-credentials-in-responses.mdc` | **KEEP** | MB-specific security; candidate PROMOTE in Plan 09 |
| `commands-from-metaboost-root.mdc` | **KEEP** | Mirror of Podverse `commands-from-monorepo-root` |
| `path-casing-imports.mdc` + skill | **KEEP** | MB/CI lesson learned |
| `single-readme.mdc` + skill | **KEEP** | MB doc layout policy |
| `i18n-locale-language.mdc` | **KEEP** | Overlaps Podverse `i18n-management`; MB-specific |
| `plan-execution-completion-tracking.mdc` | **KEEP** | Overlaps Podverse `plan-lifecycle`; reconcile in stage-2 |
| `.cursor/skills/INDEX.md` | **KEEP** | Podverse has no INDEX; quick-ref is MB convention |

### Podverse-only process rules MetaBoost lacks (PARITY-GAP → stage-2)

| Rule | Decision | Notes |
| --- | --- | --- |
| `operator-only-git-operations.mdc` | **ALIGN** | In Podverse `.cursorrules`; **missing** MB rule file |
| `documentation-updates.mdc` | **ALIGN** | Generic process standard |
| `github-actions-yaml.mdc` | **ALIGN** | Pairs with CI triage Plan 05 |
| `test-timeout-budget.mdc` | **ALIGN** | Test ops standard |
| `startup-validation-env-order.mdc` | **ALIGN** | Env ops standard (+ skill in PV) |
| `config-type-safety.mdc` | **ALIGN** | Config standard |
| `build-order-doc-sync.mdc` | **ALIGN** | Build ops standard |
| `infra-k8s.mdc` | **ALIGN** | Infra standard (+ MB `k8s` skill exists) |
| `plan-lifecycle.mdc` | **ALIGN** | Reconcile with MB `plan-execution-completion-tracking` |
| `openapi-sync.mdc` | **ALIGN** | MB has `swagger-openapi` skill; align naming/content |
| `shared-ui-i18n.mdc`, `prefer-shared-ui-web-management.mdc` | **ALIGN** | Adapt for `@metaboost/ui` |
| Product-specific PV rules (media, lighthouse, extensions, etc.) | **N/A** | Defer to Plan 09 |

### `.cursorrules`

| Decision | Notes |
| --- | --- |
| **ALIGN** | Missing Podverse sections: issue linking, **operator-only git**, commands-from-root detail, richer code-quality bullets; retain MB-specific `E2E_API_GATE_MODE` test policy |

**Stage-2 spawned:** `.llm/plans/active/metaboost-abcmemory-align/` (4 implementation plans + COPY-PASTA).

## Stage-2 spawn rule

If any rules/skills are drifted vs Podverse or any index file is stale, create
`.llm/plans/active/metaboost-abcmemory-align/` enumerating each file with the exact wording/structure
to port from Podverse. Otherwise record "no stage-2 needed".

## Verification (for the operator, later)

```bash
diff <(ls /Users/mitcheldowney/repos/pv/metaboost/.cursor/rules) <(ls /Users/mitcheldowney/repos/pv/podverse/.cursor/rules)
diff <(ls /Users/mitcheldowney/repos/pv/metaboost/.cursor/skills) <(ls /Users/mitcheldowney/repos/pv/podverse/.cursor/skills)
```
