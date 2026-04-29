---
description: "LLM history tracking — essential for any file-modifying response in this repo"
applyTo: "**/*"
---

# History Tracking (Essential)

When modifying **any** files in this workspace, update `.llm/history/active/[feature]/[feature]-part-01.md` (or the latest part file):

```markdown
### Session N - YYYY-MM-DD
#### Prompt (Developer|Agent)
[Exact verbatim prompt]
#### Key Decisions
- Decision 1
#### Files Created/Modified
- path/to/file.ts
```

## 10-Session Limit

Each history file is limited to **10 sessions**. When adding session 11, create a new part file (e.g. `[feature]-part-02.md`).

## File Naming

- `.llm/history/active/[feature]/[feature]-part-01.md` (sessions 1-10)
- `[feature]-part-02.md` (sessions 11-20), etc.

End every file-modifying response with: **LLM History**: Updated `.llm/history/active/[feature]/[file].md` (Session N).
