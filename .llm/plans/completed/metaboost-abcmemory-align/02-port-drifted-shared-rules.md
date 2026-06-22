# 02 — Port drifted shared rules

## Scope

Update MetaBoost rules that exist in both repos but **drift** from Podverse source of truth.

## Files

| MetaBoost rule | Podverse source | Notes |
| --- | --- | --- |
| `css-custom-properties-no-var-fallbacks.mdc` | same name | Port Podverse clarity; keep MB token paths (`packages/ui/src/styles/_themes.scss` etc.) accurate for MB |
| `end-with-targeted-make-report-verify.mdc` | same name | Port Podverse structure; **preserve** MB `E2E_API_GATE_MODE=off` default and MB make target names |
| `plan-creation.mdc` | same name | Align wording; both use `.llm/plans/active/` |

Also review modified rules from the pending diff for export/changelog cleanup only — no change unless
still referencing removed systems:

- `llm-cursor-source.mdc` — should match post-exports Podverse policy (cursor-only, no `.llm/exports/`)

## Steps

1. Side-by-side diff each file against Podverse.
2. Port Podverse content; adapt repo names, keep MetaBoost-specific policy where triage marked KEEP.
3. Run `npm run lint:fix` if markdown in rules needs formatting.

## Verification

```bash
diff -q .cursor/rules/llm-cursor-source.mdc ../podverse/.cursor/rules/llm-cursor-source.mdc
npm run lint
```
