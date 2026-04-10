# LLM Development History

## Overview

This directory tracks LLM-assisted development on the Metaboost project. It provides:

- A record of what was built and why
- Context for future LLM sessions
- Documentation of decisions

## Directory Structure

```
.llm/
├── LLM.md
├── history/
│   ├── active/            # Features in progress
│   │   └── [feature]/
│   │       └── [feature]-part-01.md
│   └── completed/         # Archived by month (optional)
│       └── YYYY-MM/
├── plans/
│   ├── active/
│   └── completed/
├── context/               # Optional codebase summaries
└── templates/
    └── prompt-template.md
```

## When to Update History

Update history when modifying code, config, docs, or plans. Skip for pure Q&A with no file changes.

## History Entry Format

```markdown
### Session N - YYYY-MM-DD

#### Prompt (Developer|Agent)

[Exact verbatim prompt]

#### Key Decisions

- Decision 1

#### Files Modified

- path/to/file.ts
```

- **Prompt (Developer)** – Manually typed by user
- **Prompt (Agent)** – System-generated (e.g. Build on a plan)

## 10-Session Limit

Each history file has at most **10 sessions**. When adding session 11, create a new part file (e.g. `[feature]-part-02.md`) and continue numbering sessions there. Always start with `-part-01` for the first file.

See **.cursor/skills/llm-history/SKILL.md** for full guidelines.
