# 03 — Port drifted shared skills

## Scope

Sync MetaBoost skills that have Podverse counterparts but content drift. Adapt paths and package
names; keep MetaBoost-only skills untouched.

## Files to port

| Skill | Podverse source | Keep MB-specific |
| --- | --- | --- |
| `abcmemory` | yes | MB doc links |
| `docker-runtime-workspace-parity` | yes | `@metaboost/*`, MB Docker paths |
| `import-specifiers-tiered` | yes | MB import-specifiers doc path |
| `management-post-save-navigation` | yes | MB `ROUTES`, management-web paths |
| `llm-cursor-source` | yes | MB branch prefix `llm/` |
| `response-ending-make-verify` | yes | MB make targets, `E2E_API_GATE_MODE` |
| `reusable-components` | yes | `@metaboost/ui` |

## MetaBoost-only skills (do not delete)

`plan-files-convention`, `argocd-gitops-push`, `linear-baseline-gz-sync`, `path-casing-imports`,
`single-readme`, and other MB-only dirs from triage Plan 03 — **KEEP** as-is unless a direct
Podverse duplicate exists with clearer wording.

## Steps

1. For each skill in the table, diff against Podverse `SKILL.md`.
2. Port structure and policy; replace `@podverse` → `@metaboost`, app paths, doc links.
3. Update `.cursor/skills/INDEX.md` quick-ref if a newly critical skill should appear (optional).

## Verification

```bash
npm run lint
```
