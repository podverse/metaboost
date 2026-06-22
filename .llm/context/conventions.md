# Metaboost Conventions

Reference summary for contributors. Full detail: [AGENTS.md](/AGENTS.md).

## TypeScript

- Strict mode, no `any` types
- DTOs and shared types from `@metaboost/helpers` where applicable
- Prefer named exports; avoid `export default` except framework-required defaults (e.g. Next.js `page.tsx`)

## Naming

- Files: kebab-case
- Classes: PascalCase
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE

## Style

- Semicolons required, single quotes, 2-space indent
- Strict equality (`===` / `!==` only)
- Type-only imports on a separate line: `import type { X } from '...'`

## Import order

Organize imports in this order, separated by blank lines:

1. Node built-ins (`fs`, `path`, etc.)
2. External packages (`express`, `typeorm`, etc.)
3. Workspace packages (`@metaboost/helpers`, `@metaboost/orm`, etc.)
4. Relative imports (local files)
5. Style imports (SCSS/CSS) last in components/pages

```typescript
import path from 'path';

import express from 'express';
import { DataSource } from 'typeorm';

import { logger } from '@metaboost/helpers';
import { User } from '@metaboost/orm';

import { config } from './config';
```

Enforced by ESLint; fix with `npm run lint:fix`.

## Import specifiers

- **Tier A** (packages except `ui`, APIs, sidecars, tools): NodeNext **`.js`** relative specifiers
- **Tier B** (`apps/web/src`, `apps/management-web/src`): **extensionless** relative imports for bundler/Turbopack

See [docs/development/tooling/DOCS-DEVELOPMENT-TOOLING-IMPORT-SPECIFIERS.md](/docs/development/tooling/DOCS-DEVELOPMENT-TOOLING-IMPORT-SPECIFIERS.md).

## Database

- Table and column names: snake_case
- TypeORM `orderBy`: entity property names (camelCase), not column names

## Git

- Present tense commits
- Include issue refs when applicable
- Branches: `feature/`, `fix/`, `chore/`, `docs/`, `hotfix/`, `release/`, `llm/` (see [DOCS-DEVELOPMENT-LLM.md](/docs/development/llm/DOCS-DEVELOPMENT-LLM.md) for `llm/` scope)

## GitHub Issues

**Templates**: Use appropriate templates for different work types when available.

**Labels**: See [docs/repo-management/GITHUB-LABELS.md](/docs/repo-management/GITHUB-LABELS.md) for the complete reference.

## Error handling

### API errors

- Use typed errors or shared helpers for known error types
- Return appropriate HTTP status codes
- Log unexpected errors with context; do not log expected auth failures as errors

```typescript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  logger.error('someOperation failed', { error, context });
  throw error;
}
```

### Service errors

- Let errors propagate to callers
- Add context when rethrowing

## Logging

Use the centralized logger from `@metaboost/helpers`:

```typescript
import { logger } from '@metaboost/helpers';

logger.info('Processing request', { userId });
logger.warn('Retrying request', { attempt, maxAttempts });
logger.error('Operation failed', { error, context });
```

- Include relevant context objects
- Do not log sensitive data (passwords, tokens)
- Empty `LOG_DIR` means console-only logging

## Environment variables

- Use SCREAMING_SNAKE_CASE; prefix by domain when helpful (`DB_`, `KEYVALDB_`, `API_`)
- Canonical templates: `apps/*/.env.example`, `infra/config/env-templates/`
- Config modules must not hide missing env with defaults — validation fails fast at startup (see [AGENTS.md](/AGENTS.md))

## Plans

- Active plans: `.llm/plans/active/<name>/`
- Keep each plan file under 300 lines
- See **plan-files-convention** skill and **plan-execution-completion-tracking** rule
