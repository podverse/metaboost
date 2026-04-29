---
name: llm-history
description: LLM history tracking guidelines. Use when updating history files or starting new feature work.
version: 1.0.0
---


# LLM History Tracking

This skill provides guidelines for maintaining LLM development history in the Metaboost repo. The Cursor rule `llm-history-tracking.mdc` is the always-applied requirement.

## Critical Rule: 10-Session Maximum Per File

**Each history file must contain at most 10 sessions.** When session 11 needs to be added, the file must be split.

## File Location Pattern

```
.llm/history/active/[feature-name]/
  [feature-name]-part-01.md      # Sessions 1-10 (always start with part-01)
  [feature-name]-part-02.md      # Sessions 11-20
```

**Always use the `-part-01` suffix from the beginning, even for the first file.**

## When to Split

When a history file has 10 sessions and you need to add session 11: create a new file with `-part-02` suffix and add session 11 there. Session numbers are continuous across parts (never reset).

## Session Entry Format

```markdown
### Session N - YYYY-MM-DD

#### Prompt (Developer)

[Exact verbatim user prompt - never summarize]

#### Key Decisions

- Decision 1

#### Files Modified

- path/to/file.ts
```

## Prompt Source Labels

- **`#### Prompt (Developer)`** - Manually typed by user
- **`#### Prompt (Agent)`** - System-generated (e.g., clicking "Build" on a plan)

## When to Update History

Update when modifying code, config, docs, or plans. Skip for pure Q&A with no file changes.

## Required sequence

1. Record the prompt first in the active history file (verbatim text, correct prompt source label).
2. Make the file changes.
3. Finalize the same session entry with key decisions and files modified.

This skill is the canonical source for history timing and entry format.

## Response Ending

End file-modifying responses with:

**LLM History**: Updated .llm/history/active/[feature]/[file].md (Session N)

## See Also

- `.llm/exports/opencode/instructions/llm-history-tracking.instructions.md` - Cursor rule with glob triggers
- `.llm/LLM.md` - Complete history system documentation
