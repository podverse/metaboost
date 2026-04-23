---
name: metaboost-global-patterns
description: Global patterns for the Metaboost repo (API + Next.js app). Use when starting work in the repo or when applying repo-wide code quality, structure, or plan/history conventions.
version: 1.1.1
---

# Global Patterns

## Structure

- **API**: `apps/api/` – Standalone Express HTTP API
- **Web**: `apps/web/` – Next.js app
- **Sidecar**: `apps/web/sidecar/` – Runtime-config server for the Next.js app

## TypeScript

- Extend `tsconfig.base.json` in apps. Use ESM (NodeNext). Avoid type assertions (`as`) when a better approach exists.
- Prefer **named exports**; avoid `export default` in ordinary modules when a named export works. See **.cursor/skills/prefer-named-exports/SKILL.md** (Next.js `page` defaults excepted).

## Plan Management

- Plans go in `.llm/plans/active/` (not `.cursor/plans/`).
- **300 line limit** per plan. Split into sub-plans in the same directory if larger.

## Documentation

- Documentation naming rules are canonical in **.cursor/skills/documentation-conventions/SKILL.md**.

## LLM History

- Follow **.cursor/skills/llm-history/SKILL.md** as the canonical history process (timing, format, and split rules).
- See `.llm/LLM.md` for the full system documentation.

## Code Quality

- **Import path casing:** Relative import paths must match the exact casing of files and directories on disk so builds pass on Linux/CI. See **.cursor/skills/path-casing-imports/SKILL.md** and **.cursor/rules/path-casing-imports.mdc**.
- Strict equality (`===` / `!==` only). Semicolons in JS/TS. Prefer `import type` for type-only imports.
- **Exports:** Do not re-export symbols from app code (e.g. `lib/validation.ts`) when they are already exported by a shared package (e.g. `@metaboost/helpers`). Callers should import from the canonical source; unnecessary re-exports add indirection and maintenance cost.
- **Catch blocks:** If the error value is not used, use `catch { ... }` (no variable). Put at least one comment inside the block when swallowing errors so ESLint **`no-empty`** passes. See **.cursor/skills/catch-unused-error/SKILL.md**.
- **Unused props/vars:** Remove them; do not keep and destructure as `_unused`. See **.cursor/skills/avoid-unused-props-vars/SKILL.md**.
- **Component props:** Do not pass `undefined` explicitly to components. Allow `null` as a value for optional props so callers can pass `prop={value}` directly; components treat `null` (and `undefined`) as "not set" / default behavior. When checking optional string props (e.g. error messages) for "has value", use a simple falsy check (`Boolean(value)` or `if (value)`) instead of explicit `!== undefined && !== null && !== ''`.
- **No inline styles:** Do not use `style={{ ... }}` for layout or appearance. Use CSS classes instead: component or page SCSS modules (e.g. `ComponentName.module.scss`), or shared utility classes where appropriate. Keeps styling maintainable and consistent.

## Agent/plan work: do not run tests

- **Do not run tests or verification commands** (e.g. `make e2e_test_web`, `npm run test`, `make e2e_test_web_signup_enabled`) during agent or plan implementation work.
- **Only instruct the user** to run those commands after your work is done. Provide the exact command(s) in a fenced `bash` block so the user can copy and run them.
- See **response-ending-make-verify** for which commands to suggest.

## Testing: no rate-limit tests

- **Do not add tests that assert rate-limit behavior** (e.g. 429 after N requests) in api or management-api. Rate limiting is disabled in test (high limit); dedicated rate-limit tests have been removed as a chronic source of flakiness. See **api-testing** skill.

## Test Command Efficiency (Agent default)

- When **suggesting** verification commands to the user, start with the **smallest targeted command** that can verify the behavior.
- Prefer single-file or single-spec commands before suite-level commands (for example, one Vitest file or one Playwright spec).
- Escalate to broader commands only when required by scope or when a targeted run passes and broader confidence is needed.
- Avoid defaulting to full test suites when a focused command can confirm the same fix faster.
