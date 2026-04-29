---
name: database-schema-naming
description: Table and column names in this repo use snake_case. Use when adding or changing ORM entities, migrations, or init SQL.
---


# Database schema: snake_case

## Rule

**Table names** use **singular** nouns (e.g. `user`, `user_credentials`, `user_bio`, `verification_token`). **Column names** use **snake_case** (e.g. `display_name`, `created_at`, `profile_visibility`).

- **SQL / init scripts** (`infra/k8s/base/db/source/`, `packages/orm`): Define tables in singular and columns in snake_case.
- **TypeORM entities**: Use camelCase for TypeScript properties. Map to the database with an explicit `name` when they differ:
  - `@Entity('user')` — table name singular, snake_case.
  - `@Column({ name: 'display_name', ... })` for property `displayName`.
  - `@Column({ name: 'profile_visibility', ... })` for property `profileVisibility`.
  - `@CreateDateColumn({ name: 'created_at' })` for `createdAt`, and similarly for `updated_at`.

If you add a new entity or column without `name`, TypeORM will use the property name as the column name (camelCase), which will not match the schema and will cause runtime errors (e.g. `column "displayName" does not exist`). Always use singular table names and snake_case columns in the DB, and map explicitly in the entity when the property is camelCase.

**Public `id_text` columns** (e.g. `user.id_text`, `bucket.id_text`): SQL type is **`nano_id_v2`** (Postgres domain `VARCHAR(15)` with 9–15 length); ORM properties use **`idText`**; JWT claim **`id_text`**; helpers use `NANO_ID_V2_*` and `isValidNanoIdV2IdText` (aligned with Podverse).

## See also

- **linear-db-migrations** (`.llm/exports/opencode/skills/linear-db-migrations/SKILL.md`) when changing migration files, ops bundles, or bootstrap under `infra/k8s/base/db/`.
