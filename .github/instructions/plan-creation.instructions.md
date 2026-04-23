---
description: "Plan creation - breaking large plans into separate files"
applyTo: ".llm/plans/**/*.md"
---

# Plan Creation

When creating a plan, if it is too large, **do not implement it immediately**. Instead:

1. Break it into separate files
2. Save those files in `.llm/plans/active/`
3. Wait for the user to prompt you to complete them one-by-one

Plans must be under 300 lines. For file layout (00-EXECUTION-ORDER, COPY-PASTA, etc.), use the **plan-files-convention** skill (`.github/skills/plan-files-convention/SKILL.md`).
