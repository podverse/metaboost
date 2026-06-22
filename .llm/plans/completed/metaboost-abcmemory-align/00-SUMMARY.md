# MetaBoost abcmemory align — Summary

## Purpose

Port and adopt Podverse (source of truth) `.cursor/` agent guidance into MetaBoost after triage Plan
03 found structural parity (hooks/prompts) but **process-rule gaps** and **content drift** on shared
rules/skills.

## Scope

- Adopt missing generic Podverse process rules (adapt repo names/paths).
- Port drifted shared rules and skills from Podverse counterparts.
- Update `.cursorrules` to include operator-only git and other Podverse LLM workflow sections.
- **Keep** MetaBoost-only rules/skills (`api-no-pii-credentials`, `path-casing-imports`,
  `single-readme`, `commands-from-metaboost-root`, `plan-execution-completion-tracking`).

Out of scope: Podverse-product-specific rules (media player, lighthouse, workers, add-by-rss) —
handled in Plan 09 `metaboost-podverse-parity-gaps`.

## Plans

| File | Focus |
| --- | --- |
| 01-adopt-podverse-process-rules.md | Add missing `.mdc` rules from Podverse |
| 02-port-drifted-shared-rules.md | Sync shared rules that differ from Podverse |
| 03-port-drifted-shared-skills.md | Sync shared skills; `@metaboost/*` path adaptation |
| 04-align-cursorrules.md | Merge Podverse `.cursorrules` sections into MetaBoost |

## Verification

```bash
diff <(ls /Users/mitcheldowney/repos/pv/metaboost/.cursor/rules | sort) <(ls /Users/mitcheldowney/repos/pv/podverse/.cursor/rules | sort)
npm run lint
```
