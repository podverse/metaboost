---
description: "When adding, editing, or deleting Cursor skills/rules or .cursorrules, also sync matching VS Code Copilot files under .github in the same change."
applyTo:
   - ".cursor/skills/**"
   - ".cursor/rules/**"
   - ".cursorrules"
   - ".github/skills/**"
   - ".github/instructions/**"
   - ".github/copilot-instructions.md"
   - "scripts/development/llm/cursor-to-copilot-*.mjs"
---

# Cursor/Copilot Sync Policy

Source of truth is Cursor customization content:

- `.cursor/skills/**`
- `.cursor/rules/**`
- `.cursorrules`

VS Code Copilot files under `.github/**` must be kept in sync in the same change.

## Required Workflow

1. Edit Cursor source files first.
2. Run sync tooling:
   - `npm run llm:sync:cursor-copilot`
3. Validate mirrored files:
   - `npm run llm:sync:cursor-copilot:check`
4. Include both source and mirrored updates in the same commit.

## Mapping

- `.cursor/skills/<name>/SKILL.md` -> `.github/skills/<name>/SKILL.md`
- `.cursor/rules/<rule>.mdc` -> `.github/instructions/<rule>.instructions.md`
- `.cursorrules` -> `.github/copilot-instructions.md`

## Guardrails

- Do not update only `.github` mirrors when the corresponding `.cursor` source should change.
- Keep skill `name` equal to the skill folder name.
- Ensure each `.github/instructions/*.instructions.md` has `description` frontmatter.
