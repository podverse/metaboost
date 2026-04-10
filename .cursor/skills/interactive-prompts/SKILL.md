---
name: interactive-prompts
description: Do not complete steps that require interactive prompts (inquirer, CLI input). Tell the user their input is needed and provide exact instructions.
version: 1.0.0
---

# Interactive Prompts

When a workflow **requires the user to enter input at a prompt** (e.g. inquirer, readline, "Enter…", "Select…"), do **not** try to complete that step automatically.

## Rule

1. **Do not** run or "complete" steps that depend on interactive prompts.
2. **Do** stop and tell the user that **their input is needed**.
3. **Do** give **clear, copy-pasteable instructions**: exact commands and what to enter or select.

## Summary

- **Don't:** Pipe input, fake prompts, or mark interactive steps as "done" without user action.
- **Do:** State that the user must complete the prompt steps and give exact instructions.
