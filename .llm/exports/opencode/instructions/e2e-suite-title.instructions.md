---
description: "E2E top-level suite title is a concise phrase; nested describe, test titles, and step labels stay verbose."
applyTo:
  - "apps/web/e2e/**/*.spec.ts"
  - "apps/management-web/e2e/**/*.spec.ts"
---

# E2E Suite Title Convention

When adding or editing E2E specs:

- **Top-level** `test.describe(...)` (the suite): use a **concise, title-like phrase** (e.g. "Home page for the unauthenticated user"). Do not use "This suite verifies …" or other long sentence forms.
- **Non-default auth mode:** End the title with `(admin_only_email)` or `(user_signup_email)` when the spec runs in that mode; do not use the word "mode". Default `admin_only_username` has no suffix.
- **Nested** describe, **test titles**, and **step labels**: keep **verbose sentence-style**.

Applies to both `apps/web/e2e` and `apps/management-web/e2e`. Full guidance: `.llm/exports/opencode/skills/e2e-readability/SKILL.md`.
