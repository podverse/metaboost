# `.llm/` directory

**Planning workspace** for this repo — feature plans, optional history, human templates, and reference context.

**Not abcmemory.** Standing agent guidance (what Cursor loads every session) lives **only** under [`.cursor/`](/.cursor/skills/abcmemory/SKILL.md) plus `.cursorrules` and `.cursorignore`. When you say **abcremember**, agents write to `.cursor/`, not here, unless you explicitly ask otherwise.

## Directory index — `.llm/` (planning workspace)

| Path | Operator doc |
| --- | --- |
| `.llm/context/` | [LLM-CONTEXT.md](context/LLM-CONTEXT.md) |
| `.llm/history/active/` | [LLM-HISTORY-ACTIVE.md](history/active/LLM-HISTORY-ACTIVE.md) |
| `.llm/history/completed/` | [LLM-HISTORY-COMPLETED.md](history/completed/LLM-HISTORY-COMPLETED.md) |
| `.llm/plans/active/` | [LLM-PLANS-ACTIVE.md](plans/active/LLM-PLANS-ACTIVE.md) |
| `.llm/plans/completed/` | [LLM-PLANS-COMPLETED.md](plans/completed/LLM-PLANS-COMPLETED.md) |
| `.llm/templates/` | [LLM-TEMPLATES.md](templates/LLM-TEMPLATES.md) |

## Directory index — abcmemory (`.cursor/`)

| Path | Operator doc |
| --- | --- |
| `.cursor/skills/` | [CURSOR-SKILLS.md](/.cursor/skills/CURSOR-SKILLS.md) |
| `.cursor/rules/` | [CURSOR-RULES.md](/.cursor/rules/CURSOR-RULES.md) |
| `.cursor/prompts/` | [CURSOR-PROMPTS.md](/.cursor/prompts/CURSOR-PROMPTS.md) |
| `.cursor/hooks/` | [CURSOR-HOOKS.md](/.cursor/hooks/CURSOR-HOOKS.md) |

Vocabulary: **abcmemory** / **abcremember** — [abcmemory skill](/.cursor/skills/abcmemory/SKILL.md).

## Layout

```
.llm/
├── LLM.md                 # This file
├── context/               # Codebase summaries for contributors (e.g. architecture)
├── history/
│   ├── active/            # Optional per-feature folders if your team records notes here
│   └── completed/         # Archived by automation or manually (see below)
├── plans/
│   ├── active/
│   └── completed/
└── templates/             # Human templates for plans/history (not abcmemory)
```

Empty layout directories may contain a `.gitkeep` so git tracks the folder after clone.

## abcmemory vs `.llm/` (do not merge)

| Question | Answer |
| --- | --- |
| Where is abcmemory? | **Only** `.cursor/` + `.cursorrules` + `.cursorignore` |
| What is `.llm/`? | Planning workspace — not loaded as standing agent rules |
| **abcremember** default target? | `.cursor/` only |
| Agent prompt snippets? | `.cursor/prompts/` (abcmemory), not `.llm/templates/` |
| Human copy-paste blanks? | `.llm/templates/` |
| Active feature plans? | `.llm/plans/active/<name>/` |
| `.llm/exports/`? | **Do not create.** Multi-editor mirrors are prohibited; use `.cursor/` only |

## Plans

Active work lives under `.llm/plans/active/`; completed sets move to `.llm/plans/completed/`. See
`.cursor/skills/plan-files-convention/SKILL.md`, **plan-execution-completion-tracking** rule, and
**plan-creation** rule for the 300-line plan limit and COPY-PASTA completion tracking. (Podverse
also documents a **plan-completion** skill; Metaboost encodes the same lifecycle in the rule above.)

**Import specifiers (Tier A vs Next `src`):** see [docs/development/tooling/DOCS-DEVELOPMENT-TOOLING-IMPORT-SPECIFIERS.md](/docs/development/tooling/DOCS-DEVELOPMENT-TOOLING-IMPORT-SPECIFIERS.md).

## Optional history notes

Some teams keep markdown notes under `.llm/history/active/<feature>/`. That is **optional** and not required for contributing.

A retired description of an older session-logging workflow (for humans only) lives in
`docs/development/llm/LLM-HISTORY-WORKFLOW-ARCHIVE.md`. That path is listed in `.cursorignore`
so Cursor does not treat it as agent instructions.

### Completing features (GitHub Actions)

When a PR merges to `develop`, `.github/workflows/complete-feature.yml` may detect a matching
folder under `.llm/history/active/<feature-name>/` (derived from the branch name), set completion
metadata, move it under `.llm/history/completed/YYYY-MM/`, and push. Requires GitHub App secrets
(`APP_ID`, `APP_PRIVATE_KEY`) — see [GITHUB-SETUP.md](/docs/repo-management/GITHUB-SETUP.md). If no
folder exists, the job no-ops. Plan-set moves under `.llm/plans/` remain manual per
**plan-execution-completion-tracking** rule.
